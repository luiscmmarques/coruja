/**
 * Fetching a cover image, and the one distinction that decides whether it is ever tried again.
 *
 * ## Why this is its own module
 *
 * The db layer used to do this inline and flatten every failure to `null`, the way `lookup.ts` flattens every failure to a missing field. For metadata that is right — the recovery is identical. For a cover it is not, because the two failures need opposite responses:
 *
 * - **`gone`** — the provider answered, and the answer is "no image here". Open Library constructs a cover URL for every edition it knows and serves `404` when it has none (`?default=false` is put there for exactly this), so this is the common case, and retrying it is a request spent to learn the same thing.
 * - **`failed`** — the request never got an answer: offline, a timeout, a DNS failure, or a cross-origin refusal. Nothing was learnt, so this one is worth trying again later.
 *
 * Collapsing the two is how covers went permanently missing: a book whose cover fetch failed had its queue entry deleted as "enriched", and nothing ever looked again.
 *
 * The concrete case that made this urgent is Google Books. `books.google.com/books/content` serves the thumbnail with **no `Access-Control-Allow-Origin` header at all** (verified live; it also answers `405` to a preflight), so a browser `fetch` of a Google cover can never succeed, however many times it is tried — while `covers.openlibrary.org` sends `access-control-allow-origin: *`, which is why Open Library's covers work and Google's do not. That is a `failed`, correctly: it is not the provider saying "no image", and it stops being true the day the Worker proxy in TODO.md lands and owns the response headers.
 *
 * ## Framework-free, database-free
 *
 * Takes a `fetchFn` and returns a blob, exactly like `lookup.ts`, so the outcome table above is testable in node with no browser and no fixtures on disk. Storing the blob is the caller's business.
 */

/**
 * Long enough for a cover on a slow train, and longer than the metadata budget because an image is bigger than a JSON record.
 */
const COVER_TIMEOUT_MS = 15_000;

/**
 * What became of a cover request. `image` carries the bytes; the other two are the retry decision, and nothing else in the app needs to know which HTTP status produced them.
 */
export type CoverResult =
	{ outcome: 'image'; blob: Blob } | { outcome: 'gone' } | { outcome: 'failed' };

/**
 * Fetch `url` as an image.
 *
 * Statuses are read for retriability rather than for meaning: `5xx` and `429` are the provider having a bad minute, so they are `failed`; any other non-2xx is its considered answer, so it is `gone`. A 2xx body that is empty or not an image is `gone` too — Open Library has been seen serving a placeholder rather than a 404, and a grey square stored once is a grey square forever, which is worse than no cover at all.
 */
export async function fetchCoverImage(
	url: string,
	fetchFn: typeof fetch = fetch
): Promise<CoverResult> {
	let response: Response;
	try {
		response = await fetchFn(url, { signal: AbortSignal.timeout(COVER_TIMEOUT_MS) });
	} catch {
		// Offline, timed out, DNS, or a cross-origin refusal: nothing was learnt.
		return { outcome: 'failed' };
	}

	if (response.status >= 500 || response.status === 429) return { outcome: 'failed' };
	if (!response.ok) return { outcome: 'gone' };

	try {
		const blob = await response.blob();
		if (blob.size === 0 || !blob.type.startsWith('image/')) return { outcome: 'gone' };
		return { outcome: 'image', blob };
	} catch {
		// A body that died mid-read is a truncated download, not an answer.
		return { outcome: 'failed' };
	}
}
