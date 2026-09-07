/**
 * ISBN in, `BookMetadata` out. Rung 3 of the app's core loop: the book row already exists by the time anything here runs, so this only ever fills fields in.
 *
 * ## This is the app's only network egress
 *
 * Nothing else in coruja talks to the internet — no analytics, no beacon, no fonts from a CDN. That is not a convention, it is enforced: `connect-src` in vite.config.ts pins exactly the origins used below, and the browser blocks the rest. **Adding a provider means editing both files**, and the CSP is the half that is easy to forget, because everything works in `vite dev` and fails in the built app.
 *
 * The privacy cost is stated plainly in PLAN.md: a lookup tells the provider "someone at this address looked up this book". It cannot be reduced to zero without giving up auto-fill, so it is disclosed, `settings.lookupEnabled` switches it off, and the manual path stays fully functional.
 *
 * ## Framework-free, database-free
 *
 * No Svelte, no Dexie. The db layer calls these functions and decides what to persist, which keeps this file a pure function of the network: give it a `fetchFn` and it is testable in node with no browser and no fixtures on disk.
 *
 * ## A `null` result is not an error
 *
 * Unknown ISBN, offline, provider down — all one answer, `null`. The caller queues a `PendingLookup` and drains it when connectivity returns, so a book added on a train fills itself in later without anyone revisiting it. Nothing here throws: an exception would have to be handled identically at every call site.
 *
 * ## Cover URLs are for fetching, not for rendering
 *
 * The provider hands back an image URL on a third-party origin. `img-src` allows only `self`, `data:` and `blob:`, so putting one of these straight into an `<img src>` is a CSP violation — and would break offline anyway. They are listed in `connect-src` so the cover can be fetched once and stored as a blob, which is what the shelf renders.
 */

import type { BookMetadata } from './domain/types.ts';

/**
 * Per-request budget. Long enough for Open Library on a slow train, short enough that a hung request does not hold the drain queue behind it.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * MARC codes to the base tags `Book.language` stores. Deliberately a small table rather than a library: these are the languages a household of English, French and Portuguese readers actually meets, plus their shelf neighbours. An unknown code yields no language, which is honest — a wrong language would quietly corrupt the Two Tongues badge, and a missing one only leaves it unearned.
 */
const MARC_LANGUAGES: Readonly<Record<string, string>> = {
	eng: 'en',
	fre: 'fr',
	por: 'pt',
	ger: 'de',
	spa: 'es',
	ita: 'it'
};

/* ------------------------------------------------------------------ narrowing helpers */

/** JSON from a third party is `unknown`; these turn it into fields without throwing. */
function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

/** Trimmed non-empty string, or nothing. An empty title is the same as no title. */
function asText(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed === '' ? undefined : trimmed;
}

/**
 * A page count only if it is a positive number. Open Library has been seen returning this as a string, so numeric strings are accepted; `0` and `-1` are not, because a zero-page book would silently distort the pages badges.
 */
function asCount(value: unknown): number | undefined {
	const numeric = typeof value === 'string' ? Number(value) : value;
	if (typeof numeric !== 'number' || !Number.isFinite(numeric) || numeric <= 0) return undefined;
	return Math.round(numeric);
}

function isText(value: string | undefined): value is string {
	return value !== undefined;
}

/**
 * The first four-digit run in a date, whatever shape the provider chose: Open Library writes `'May 1, 2003'`, `'2003'` or `'1988-06'` depending on the record. Parsing to a `Date` would be worse — it guesses a day and a timezone that the source never claimed, and only the year is ever displayed.
 */
function yearFrom(value: unknown): number | undefined {
	const text = asText(value);
	const match = text ? /\d{4}/.exec(text) : null;
	if (!match) return undefined;
	const year = Number(match[0]);
	// A bound wide enough for antiquarian books, tight enough to reject an ISBN or a page count that has wandered into this field.
	return year >= 1000 && year <= new Date().getUTCFullYear() + 1 ? year : undefined;
}

/**
 * Drops keys whose value is `undefined`, so a provider's silence is an absent field rather than a present empty one. Dexie would otherwise store the empty keys, and `deepStrictEqual` in the tests distinguishes `{ a: undefined }` from `{}`.
 */
function compact(metadata: BookMetadata): BookMetadata {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(metadata)) {
		if (value !== undefined) result[key] = value;
	}
	return result as BookMetadata;
}

/** Metadata is worth keeping only if it names the book. A lone cover identifies nothing. */
function isUseful(metadata: BookMetadata): boolean {
	return metadata.title !== undefined;
}

/**
 * One GET, parsed as JSON, with every failure flattened to `null`: a non-2xx status, a timeout, a DNS failure, an offline device, a body that is not JSON. Callers branch on presence, never on cause — the recovery is identical.
 *
 * No custom headers on purpose, and not only for the preflight cost. Open Library's rate-limit etiquette asks API clients for a `User-Agent` naming the app and a contact address — but its CORS preflight rejects that header from a browser (verified live: OPTIONS with `Access-Control-Request-Headers: user-agent` answers `400 Disallowed CORS headers`; the allowlist is Accept, Accept-Language, Content-Language, Content-Type). Setting it would break every lookup in the built app. Browser requests identify themselves anyway: each one carries `Origin: https://coruja.app`, from which the contact (hi+openlibrary@coruja.app) is discoverable. The full `User-Agent: CorujaApp (hi+openlibrary@coruja.app)` goes in the v1.1 Worker proxy, which owns its own headers — see PLAN.md.
 */
async function getJson(url: string, fetchFn: typeof fetch): Promise<unknown | null> {
	try {
		const response = await fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
		if (!response.ok) return null;
		return (await response.json()) as unknown;
	} catch {
		return null;
	}
}

/**
 * Open Library's cover by ISBN. `default=false` makes a missing cover a 404 instead of a placeholder image, so the fetch-to-blob step can tell "no cover" from "grey square". Nothing here confirms the image exists; that happens when it is fetched.
 */
function openLibraryCoverUrl(isbn13: string): string {
	return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn13)}-M.jpg?default=false`;
}

/**
 * Origins a cover may be fetched from — the same list `connect-src` pins in vite.config.ts, minus the JSON endpoints.
 *
 * Needed because Open Library's `cover.medium` does not always point at its own cover service: it has been observed returning `https://archive.org/download/…` URLs, which the CSP rightly blocks — a console violation on every such book, and no cover. Any off-list URL is swapped for the constructed Open Library one, which serves the same image when it exists.
 */
const COVER_ORIGINS = ['https://covers.openlibrary.org', 'https://archive.org'];

function safeCoverUrl(url: string | undefined, isbn13: string): string {
	if (url && COVER_ORIGINS.some((origin) => url.startsWith(origin + '/'))) return url;
	return openLibraryCoverUrl(isbn13);
}

/* ---------------------------------------------------------------------- Open Library */

/**
 * Open Library, the only provider: a real commons, generous with browser requests, no key, run by the Internet Archive — a non-profit whose mission is open access rather than ad-tech, which matters for an app whose privacy page says the ISBN is the only thing that leaves the device.
 *
 * Google Books used to be the fallback here, and was removed rather than fixed: its keyless quota answered `Queries per day: 0` on first real use, so the fallback was a guaranteed 429 — worse than no fallback, because it burned a request and logged an error for every book Open Library missed. Bring-your-own-API-key Google support is a v2 idea (a Setup field, the key stored locally like everything else); until then, a book Open Library does not know is a hand-entered book, which even earns a badge.
 *
 * Requests, in order:
 *
 * 1. `/api/books?jscmd=data` returns author *names* and a cover URL directly — the
 *    alternative gives authors as `/authors/OL…` keys that each cost their own request.
 * 2. The edition record (`{olKey}.json`) **when the first answer has no language**,
 *    which is always, because `jscmd=data` does not report one. This second request was originally rejected as "the wrong trade for a field only one badge reads" — and then the household turned out to be bilingual, which is what the field is *for*. It also fills publisher, pages and year when the data view lacked them.
 * 3. `/isbn/{isbn}.json` only when the data endpoint could not be reached at all. Both
 *    views share edition records, so it is a fallback for a failed *request*, never for an unknown *book* — asking about a book the data endpoint definitively does not know would be a guaranteed 404.
 */
export async function fromOpenLibrary(
	isbn13: string,
	fetchFn: typeof fetch = fetch
): Promise<BookMetadata | null> {
	const key = `ISBN:${isbn13}`;
	const dataUrl =
		`https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}` +
		'&format=json&jscmd=data';

	// An unknown ISBN answers 200 with `{}`, so "no record" is a missing key, not a status.
	const dataResponse = await getJson(dataUrl, fetchFn);
	const dataEntry = asRecord(asRecord(dataResponse)[key]);
	const fromData = compact({
		title: asText(dataEntry.title),
		authors: asArray(dataEntry.authors)
			.map((author) => asText(asRecord(author).name))
			.filter(isText),
		// `publishers: [{ name }]`; multi-publisher editions exist but one name is what a shelf filter needs, and the first is the primary imprint.
		publisher: asText(asRecord(asArray(dataEntry.publishers)[0]).name),
		pageCount: asCount(dataEntry.number_of_pages),
		publishedYear: yearFrom(dataEntry.publish_date),
		coverUrl: safeCoverUrl(asText(asRecord(dataEntry.cover).medium), isbn13),
		olKey: editionKey(dataEntry.key)
	});
	if (isUseful(fromData)) {
		return dropEmptyAuthors(await completeFromEdition(fromData, fetchFn));
	}

	// The data endpoint answered and does not know this book: see the doc comment.
	if (dataResponse !== null) return null;

	const edition = asRecord(await getJson(`https://openlibrary.org/isbn/${isbn13}.json`, fetchFn));
	const fromEdition = compact({
		title: asText(edition.title),
		// `authors` here are keys into another table; following them costs a request each, which is exactly what the endpoint above exists to avoid.
		publisher: asText(asArray(edition.publishers)[0]),
		pageCount: asCount(edition.number_of_pages),
		publishedYear: yearFrom(edition.publish_date),
		language: marcLanguage(edition.languages),
		coverUrl: openLibraryCoverUrl(isbn13),
		olKey: editionKey(edition.key)
	});
	return isUseful(fromEdition) ? fromEdition : null;
}

/** An edition key looks like `/books/OL8840824M`; anything else is not one. */
function editionKey(value: unknown): string | undefined {
	const text = asText(value);
	return text && /^\/books\/OL[0-9A-Z]+$/.test(text) ? text : undefined;
}

/**
 * Fill what the data endpoint could not say — above all the language — from the edition record the `olKey` names. Only ever fills gaps: a field the first answer already carries is never overwritten. A failed request costs nothing but the fields staying empty.
 */
async function completeFromEdition(
	metadata: BookMetadata,
	fetchFn: typeof fetch
): Promise<BookMetadata> {
	if (!metadata.olKey || metadata.language) return metadata;

	const edition = asRecord(await getJson(`https://openlibrary.org${metadata.olKey}.json`, fetchFn));
	return compact({
		...metadata,
		language: marcLanguage(edition.languages),
		publisher: metadata.publisher ?? asText(asArray(edition.publishers)[0]),
		pageCount: metadata.pageCount ?? asCount(edition.number_of_pages),
		publishedYear: metadata.publishedYear ?? yearFrom(edition.publish_date)
	});
}

/**
 * `[{ key: '/languages/fre' }]` to `'fr'`. Only the first entry is read: a bilingual edition has to pick one value for `Book.language`, and the first is the provider's own ordering rather than a guess of ours.
 */
function marcLanguage(value: unknown): string | undefined {
	const key = asText(asRecord(asArray(value)[0]).key);
	const code = key?.split('/').pop()?.toLowerCase();
	return code ? MARC_LANGUAGES[code] : undefined;
}

/** An empty `authors` array is noise; absent says the same thing without the key. */
function dropEmptyAuthors(metadata: BookMetadata): BookMetadata {
	if (metadata.authors && metadata.authors.length === 0) delete metadata.authors;
	return metadata;
}

/* ------------------------------------------------------------------------ the entry point */

/**
 * Metadata for `isbn13`, or `null` if Open Library does not know it.
 *
 * `fetchFn` is injected so the tests need no network and no global stubbing. The caller passes nothing in production.
 */
export async function fetchBookMetadata(
	isbn13: string,
	fetchFn: typeof fetch = fetch
): Promise<BookMetadata | null> {
	// Guard rather than request: a blank ISBN is a caller bug, and asking the provider about it would leak a pointless request and always answer null anyway.
	if (isbn13.trim() === '') return null;
	return fromOpenLibrary(isbn13, fetchFn);
}
