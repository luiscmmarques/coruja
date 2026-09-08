/**
 * ISBN in, `BookMetadata` out. Rung 3 of the app's core loop: the book row already exists by the time anything here runs, so this only ever fills fields in.
 *
 * ## This is the app's only network egress
 *
 * Nothing else in coruja talks to the internet — no analytics, no beacon, no fonts from a CDN. That is not a convention, it is enforced: `connect-src` in vite.config.ts pins exactly the origins used below, and the browser blocks the rest. **Adding a provider means editing both files**, and the CSP is the half that is easy to forget, because everything works in `vite dev` and fails in the built app.
 *
 * The privacy cost is stated plainly in PLAN.md: a lookup tells the provider "someone at this address looked up this book". It cannot be reduced to zero without giving up auto-fill, so it is disclosed, `settings.lookupEnabled` switches it off, and the manual path stays fully functional. Google Books raises that cost — Google is not a non-profit — which is why it keeps its own switch (`settings.googleBooksEnabled`, on by default like `lookupEnabled`, off on its own), and is asked only when Open Library falls short.
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
 * The provider hands back an image URL on a third-party origin. `img-src` allows only `self`, `data:` and `blob:`, so putting one of these straight into an `<img src>` is a CSP violation — and would break offline anyway. They are listed in `connect-src` so the cover can be fetched once and stored as a blob, which is what the shelf renders. (Open Library's covers guideline prefers hotlinked `<img src>` — the deliberate deviation here is *lighter* on their servers, not heavier: one fetch per cover ever, instead of one per page view.)
 */

import type { BookMetadata } from './domain/types.ts';

/**
 * Per-request budget. Long enough for Open Library on a slow train, short enough that a hung request does not hold the drain queue behind it.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Open Library's published limit for unidentified clients is 1 request per second (openlibrary.org/developers/api). Identified clients get 3, but identification rides on a `User-Agent` header the browser cannot send (see getJson) — so 1/s is the budget, and this gate enforces it client-side rather than hoping the household never scans fast enough to matter.
 */
const OPEN_LIBRARY_INTERVAL_MS = 1_000;

/**
 * When the next Open Library request may leave. Module-level on purpose: a scan, its edition follow-up and the drain queue all spend from the same budget, because Open Library sees them as the same client.
 */
let openLibraryNextSlot = 0;

/**
 * The slot arithmetic, pure so the tests can exercise it without sleeping: what a request arriving at `now` must wait, and the slot it books for the one after it.
 */
export function paceDelay(
	nextSlot: number,
	now: number,
	interval: number = OPEN_LIBRARY_INTERVAL_MS
): { wait: number; next: number } {
	return { wait: Math.max(0, nextSlot - now), next: Math.max(nextSlot, now) + interval };
}

/** Awaited before every Open Library request. Injected in tests so suites do not sleep. */
export type Pace = () => Promise<void>;

async function paceOpenLibrary(): Promise<void> {
	const { wait, next } = paceDelay(openLibraryNextSlot, Date.now());
	openLibraryNextSlot = next;
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

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
 * The first four-digit run in a date, whatever shape the provider chose: Open Library writes `'May 1, 2003'`, `'2003'` or `'1988-06'` depending on the record, and Google Books `'2007'` or `'2003-05-01'`. Parsing to a `Date` would be worse — it guesses a day and a timezone that the source never claimed, and only the year is ever displayed.
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
 * Open Library's cover, preferably by OLID. The covers API rate-limits ISBN-keyed requests to 100 per IP per 5 minutes — a family cataloguing its shelf in one first evening genuinely hits that — while OLID- and CoverID-keyed requests are unlimited. So the edition's OLID is used whenever the record supplied one, and the ISBN is the last resort.
 *
 * `default=false` makes a missing cover a 404 instead of a placeholder image, so the fetch-to-blob step can tell "no cover" from "grey square". Nothing here confirms the image exists; that happens when it is fetched.
 */
function openLibraryCoverUrl(isbn13: string, olKey?: string): string {
	const olid = olKey?.split('/').pop();
	return olid
		? `https://covers.openlibrary.org/b/olid/${olid}-M.jpg?default=false`
		: `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn13)}-M.jpg?default=false`;
}

/**
 * Origins a cover may be fetched from — the same list `connect-src` pins in vite.config.ts, minus the JSON endpoints.
 *
 * Needed because Open Library's `cover.medium` does not always point at its own cover service: it has been observed returning `https://archive.org/download/…` URLs, which the CSP rightly blocks — a console violation on every such book, and no cover. Any off-list URL is swapped for the constructed Open Library one, which serves the same image when it exists. books.google.com is here for the Google Books thumbnails, which serve directly with no redirect (verified live).
 */
const COVER_ORIGINS = [
	'https://covers.openlibrary.org',
	'https://archive.org',
	'https://books.google.com'
];

function safeCoverUrl(url: string | undefined, isbn13: string, olKey?: string): string {
	if (url && COVER_ORIGINS.some((origin) => url.startsWith(origin + '/'))) return url;
	return openLibraryCoverUrl(isbn13, olKey);
}

/* ---------------------------------------------------------------------- Open Library */

/**
 * Open Library, the primary provider: a real commons, generous with browser requests, no key, run by the Internet Archive — a non-profit whose mission is open access rather than ad-tech, which matters for an app whose privacy page says the ISBN is the only thing that leaves the device.
 *
 * Requests, in order — each one paced through the 1 request/second gate above:
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
	fetchFn: typeof fetch = fetch,
	pace: Pace = paceOpenLibrary
): Promise<BookMetadata | null> {
	const key = `ISBN:${isbn13}`;
	const dataUrl =
		`https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(key)}` +
		'&format=json&jscmd=data';

	// An unknown ISBN answers 200 with `{}`, so "no record" is a missing key, not a status.
	await pace();
	const dataResponse = await getJson(dataUrl, fetchFn);
	const dataEntry = asRecord(asRecord(dataResponse)[key]);
	const dataKey = editionKey(dataEntry.key);
	const fromData = compact({
		title: asText(dataEntry.title),
		authors: asArray(dataEntry.authors)
			.map((author) => asText(asRecord(author).name))
			.filter(isText),
		// `publishers: [{ name }]`; multi-publisher editions exist but one name is what a shelf filter needs, and the first is the primary imprint.
		publisher: asText(asRecord(asArray(dataEntry.publishers)[0]).name),
		pageCount: asCount(dataEntry.number_of_pages),
		publishedYear: yearFrom(dataEntry.publish_date),
		coverUrl: safeCoverUrl(asText(asRecord(dataEntry.cover).medium), isbn13, dataKey),
		olKey: dataKey
	});
	if (isUseful(fromData)) {
		return dropEmptyAuthors(await completeFromEdition(fromData, fetchFn, pace));
	}

	// The data endpoint answered and does not know this book: see the doc comment.
	if (dataResponse !== null) return null;

	await pace();
	const edition = asRecord(await getJson(`https://openlibrary.org/isbn/${isbn13}.json`, fetchFn));
	const fallbackKey = editionKey(edition.key);
	const fromEdition = compact({
		title: asText(edition.title),
		// `authors` here are keys into another table; following them costs a request each, which is exactly what the endpoint above exists to avoid.
		publisher: asText(asArray(edition.publishers)[0]),
		pageCount: asCount(edition.number_of_pages),
		publishedYear: yearFrom(edition.publish_date),
		language: marcLanguage(edition.languages),
		coverUrl: openLibraryCoverUrl(isbn13, fallbackKey),
		olKey: fallbackKey
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
	fetchFn: typeof fetch,
	pace: Pace
): Promise<BookMetadata> {
	if (!metadata.olKey || metadata.language) return metadata;

	await pace();
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

/* ---------------------------------------------------------------------- Google Books */

/**
 * Google Books, the gap-filler. It exists for the books Open Library is thin on — non-English children's titles above all — and is asked only when Open Library drew a blank or left fields empty, which keeps the request volume a rounding error against the key's 1,000/day quota: a household scan where Open Library answers completely costs zero Google requests.
 *
 * Google's original removal (keyless quota answered `Queries per day: 0`, so every fallback call was a guaranteed 429) is fixed by the key, not forgotten: the key is baked in at build time and is *referrer-restricted*, so shipping it in the bundle is by design — the restriction is the protection, not secrecy. No key at build time simply means this provider does not exist. The restriction also means the lookup depends on `Referrer-Policy: strict-origin-when-cross-origin` in static/_headers: tighten that to `no-referrer` and every Google request answers 403.
 *
 * One request answers everything, including the language as a plain ISO tag — no MARC table. The `q=isbn:` query can return several loosely related volumes (verified live: two items for one ISBN), so the volume is chosen by its own ISBN-13 identifier, falling back to the first item only when none carries it, because some records list only an `OTHER` identifier.
 */
/**
 * Partial-response projection (Google's `fields` parameter): exactly the fields the mapping below reads, nothing else. The full volume record is ~3 KB of description, sale info and access flags per item; this trims the transfer to a fraction and is Google's own recommended etiquette for read-heavy clients.
 */
const GOOGLE_FIELDS =
	'items(volumeInfo(title,authors,publisher,publishedDate,pageCount,language,industryIdentifiers,imageLinks))';

export async function fromGoogleBooks(
	isbn13: string,
	apiKey: string,
	fetchFn: typeof fetch = fetch
): Promise<BookMetadata | null> {
	const url =
		`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`isbn:${isbn13}`)}` +
		`&fields=${encodeURIComponent(GOOGLE_FIELDS)}` +
		`&key=${encodeURIComponent(apiKey)}`;
	const items = asArray(asRecord(await getJson(url, fetchFn)).items).map(asRecord);
	const chosen = items.find((item) => claimsIsbn(item, isbn13)) ?? items[0];
	if (!chosen) return null;

	const info = asRecord(chosen.volumeInfo);
	const metadata = compact({
		title: asText(info.title),
		authors: asArray(info.authors).map(asText).filter(isText),
		publisher: asText(info.publisher),
		pageCount: asCount(info.pageCount),
		publishedYear: yearFrom(info.publishedDate),
		language: googleLanguage(info.language),
		coverUrl: googleCoverUrl(info.imageLinks)
	});
	return isUseful(metadata) ? dropEmptyAuthors(metadata) : null;
}

/** Whether the volume's own identifiers claim this ISBN-13. */
function claimsIsbn(item: Record<string, unknown>, isbn13: string): boolean {
	return asArray(asRecord(item.volumeInfo).industryIdentifiers).some(
		(entry) => asText(asRecord(entry).identifier) === isbn13
	);
}

/**
 * Google reports a plain ISO 639 tag ('fr'), occasionally with a region ('pt-BR'); the lowercased base is what `Book.language` stores. Unlike the MARC table this accepts any base tag — the value arrives already in the target vocabulary, so there is nothing to mistranslate.
 */
function googleLanguage(value: unknown): string | undefined {
	const base = asText(value)?.toLowerCase().split('-')[0];
	return base && /^[a-z]{2,3}$/.test(base) ? base : undefined;
}

/**
 * Thumbnail URLs arrive as `http://books.google.com/…` (verified live), upgraded to https and accepted only on that exact origin: `connect-src` pins it, and a URL anywhere else would log a CSP violation on every such book.
 */
function googleCoverUrl(imageLinks: unknown): string | undefined {
	const links = asRecord(imageLinks);
	const url = (asText(links.thumbnail) ?? asText(links.smallThumbnail))?.replace(
		/^http:\/\//,
		'https://'
	);
	return url?.startsWith('https://books.google.com/') ? url : undefined;
}

/* ------------------------------------------------------------------------ the entry point */

/** What a caller may tune. Everything is optional; the defaults are production. */
export interface LookupOptions {
	/**
	 * Google Books API key. Absent or empty means Open Library alone — the shape a build without the env var takes, and a household that left the Setup toggle off.
	 */
	googleBooksKey?: string;
	/** Injected by tests so no suite touches the network. */
	fetchFn?: typeof fetch;
	/** The Open Library pacing gate; tests inject a no-op so suites do not sleep. */
	pace?: Pace;
}

/**
 * Fields Google may fill when Open Library leaves them empty. `title` is absent on purpose — no title means no record at all (`isUseful`). The cover is handled apart: Open Library always *constructs* a URL for a book it knows, and a construction is a guess, not a cover — see `isConstructedCover`.
 */
const GAP_FIELDS = ['authors', 'publisher', 'pageCount', 'language', 'publishedYear'] as const;

/**
 * True when the URL is one this module built as a guess rather than one the provider attested. Only the constructed forms carry `?default=false` — put there precisely so a miss is a 404 — which makes the marker reliable. The distinction matters in the merge: a guess 404s exactly for the books Open Library has no image of, which are the books Google was asked about (a QA scan surfaced this: record found, cover guessed, guess 404ed, real Google thumbnail ignored).
 */
function isConstructedCover(url: string | undefined): boolean {
	return url !== undefined && url.endsWith('?default=false');
}

function hasGaps(metadata: BookMetadata): boolean {
	return (
		GAP_FIELDS.some((field) => metadata[field] === undefined) ||
		isConstructedCover(metadata.coverUrl)
	);
}

/**
 * Metadata for `isbn13`, or `null` when no provider knows it.
 *
 * Open Library answers first. Google Books — when a key is configured and its Setup switch left on — is asked only when Open Library drew a blank or left gaps, and only ever fills fields in: on any field both providers answer, Open Library wins, and `editedByHand` (enforced in the db layer) beats them both. A pleasant side effect: a book Open Library genuinely does not know used to burn all eight backoff retries against it; Google settling it on the first attempt makes those retries disappear.
 */
export async function fetchBookMetadata(
	isbn13: string,
	options: LookupOptions = {}
): Promise<BookMetadata | null> {
	// Guard rather than request: a blank ISBN is a caller bug, and asking the provider about it would leak a pointless request and always answer null anyway.
	if (isbn13.trim() === '') return null;
	const { fetchFn = fetch, googleBooksKey, pace } = options;

	const primary = await fromOpenLibrary(isbn13, fetchFn, pace);
	if (!googleBooksKey || (primary && !hasGaps(primary))) return primary;

	const filler = await fromGoogleBooks(isbn13, googleBooksKey, fetchFn);
	if (!primary) return filler;
	if (!filler) return primary;
	// Spread order is the precedence: Google underneath, Open Library on top. Both sides are compacted, so an absent field cannot shadow a real value with `undefined`.
	const merged = { ...filler, ...primary };
	// One exception to Open-Library-wins: a cover Google attested beats a URL we merely guessed, because the guess 404s for exactly the books that reached this branch.
	if (filler.coverUrl && isConstructedCover(primary.coverUrl)) merged.coverUrl = filler.coverUrl;
	return merged;
}
