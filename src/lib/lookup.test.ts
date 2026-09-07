/**
 * What the provider actually answers, and what we turn it into.
 *
 * The point of these tests is the mapping and the request order, so `fetchFn` is injected rather than the global patched: no network, no `vi.mock`, no ordering hazard between suites. Assertions use `node:assert/strict` to match the domain suite — the mapping is data logic, and data logic should not need a test framework's matchers.
 *
 * The fixtures are trimmed copies of real responses, keeping the fields that trip people up: `publish_date: 'May 1, 2003'`, a MARC language key, an edition key, and an unknown ISBN answering `200 {}` rather than a 404.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fetchBookMetadata, fromOpenLibrary } from './lookup.ts';

const ISBN = '9780261103344';
const OL_KEY = '/books/OL26331930M';

/** A canned JSON response, the way the real provider sends it. */
function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

type Route = [pattern: RegExp, respond: () => Response];

/**
 * A `fetch` that answers from a route table and records what it was asked for, so a test can assert a follow-up request happened rather than inferring it from the result. Anything unmatched is a 404, which is how a real unknown URL behaves.
 */
function stubFetch(routes: Route[]): { fetchFn: typeof fetch; calls: string[] } {
	const calls: string[] = [];
	const fetchFn = (async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
		calls.push(url);
		for (const [pattern, respond] of routes) {
			if (pattern.test(url)) return respond();
		}
		return new Response(null, { status: 404 });
	}) as typeof fetch;
	return { fetchFn, calls };
}

const OPEN_LIBRARY_DATA = /openlibrary\.org\/api\/books/;
const OPEN_LIBRARY_ISBN = /openlibrary\.org\/isbn\//;
const OPEN_LIBRARY_EDITION_KEY = /openlibrary\.org\/books\/OL[0-9A-Z]+\.json/;

/** Which endpoint a recorded URL went to, so call order reads as a list of names. */
function label(url: string): string {
	if (OPEN_LIBRARY_DATA.test(url)) return 'ol-data';
	if (OPEN_LIBRARY_EDITION_KEY.test(url)) return 'ol-edition-key';
	if (OPEN_LIBRARY_ISBN.test(url)) return 'ol-isbn';
	return url;
}

/** `jscmd=data`: author names and a cover in one request, and no language field. */
const openLibraryData = {
	[`ISBN:${ISBN}`]: {
		url: `https://openlibrary.org/books/OL26331930M`,
		key: OL_KEY,
		title: 'The Hobbit',
		authors: [{ url: 'https://openlibrary.org/authors/OL26320A', name: 'J. R. R. Tolkien' }],
		publishers: [{ name: 'Houghton Mifflin' }],
		number_of_pages: 366,
		publish_date: 'May 1, 2003',
		cover: {
			small: 'https://covers.openlibrary.org/b/id/8406786-S.jpg',
			medium: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
			large: 'https://covers.openlibrary.org/b/id/8406786-L.jpg'
		}
	}
};

/** The edition record `{olKey}.json`: the one place a language lives. */
const openLibraryEditionRecord = {
	key: OL_KEY,
	title: 'The Hobbit',
	languages: [{ key: '/languages/eng' }],
	publishers: ['Houghton Mifflin'],
	number_of_pages: 366,
	publish_date: 'May 1, 2003'
};

/** `/isbn/{isbn}.json`: languages as MARC keys, authors as keys we deliberately skip. */
const openLibraryEdition = {
	key: OL_KEY,
	title: 'Le Hobbit',
	authors: [{ key: '/authors/OL26320A' }],
	publishers: ['Christian Bourgois'],
	number_of_pages: 402,
	publish_date: '2012',
	languages: [{ key: '/languages/fre' }]
};

test('the data endpoint maps, and the edition record supplies the language it lacks', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(openLibraryData)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)]
	]);

	assert.deepEqual(await fromOpenLibrary(ISBN, fetchFn), {
		title: 'The Hobbit',
		authors: ['J. R. R. Tolkien'],
		publisher: 'Houghton Mifflin',
		pageCount: 366,
		publishedYear: 2003,
		language: 'en',
		coverUrl: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
		olKey: OL_KEY
	});
	// The second request exists for the language: jscmd=data never reports one, and a bilingual household is what Book.language is for.
	assert.deepEqual(calls.map(label), ['ol-data', 'ol-edition-key']);
});

test('a failed edition-record follow-up costs only the fields it would have filled', async () => {
	const { fetchFn } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(openLibraryData)],
		[OPEN_LIBRARY_EDITION_KEY, () => new Response(null, { status: 503 })]
	]);

	const metadata = await fromOpenLibrary(ISBN, fetchFn);
	assert.equal(metadata?.title, 'The Hobbit');
	assert.equal(metadata?.language, undefined);
	assert.equal(metadata?.olKey, OL_KEY);
});

test('a record with no cover falls back to the covers-by-ISBN URL', async () => {
	const bare = { [`ISBN:${ISBN}`]: { title: 'The Hobbit', key: OL_KEY } };
	const { fetchFn } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(bare)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)]
	]);
	const metadata = await fromOpenLibrary(ISBN, fetchFn);
	assert.equal(
		metadata?.coverUrl,
		`https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg?default=false`
	);
});

test('an archive.org cover URL is kept; a foreign origin is swapped', async () => {
	// archive.org is where covers actually live (covers.openlibrary.org redirects
	// there), so a direct URL is one hop fewer. A genuinely foreign origin still gets
	// swapped for the constructed URL the CSP can follow.
	const direct = {
		[`ISBN:${ISBN}`]: {
			title: 'Le Petit Prince',
			cover: { medium: 'https://archive.org/download/m_covers_0012/0012169208-M.jpg' }
		}
	};
	const kept = stubFetch([[OPEN_LIBRARY_DATA, () => json(direct)]]);
	assert.equal(
		(await fromOpenLibrary(ISBN, kept.fetchFn))?.coverUrl,
		'https://archive.org/download/m_covers_0012/0012169208-M.jpg'
	);

	const foreign = {
		[`ISBN:${ISBN}`]: {
			title: 'Le Petit Prince',
			cover: { medium: 'https://example.com/covers/whatever.jpg' }
		}
	};
	const swapped = stubFetch([[OPEN_LIBRARY_DATA, () => json(foreign)]]);
	assert.equal(
		(await fromOpenLibrary(ISBN, swapped.fetchFn))?.coverUrl,
		`https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg?default=false`
	);
});

test('an unknown ISBN yields null after exactly one request', async () => {
	const { fetchFn, calls } = stubFetch([[OPEN_LIBRARY_DATA, () => json({})]]);
	assert.equal(await fromOpenLibrary(ISBN, fetchFn), null);
	// Both /isbn/ and the data view share edition records: a book the data endpoint definitively does not know would only produce a guaranteed 404 elsewhere.
	assert.deepEqual(calls.map(label), ['ol-data']);
});

test('the /isbn/ endpoint is a fallback for a failed request, not an unknown book', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => new Response(null, { status: 503 })],
		[OPEN_LIBRARY_ISBN, () => json(openLibraryEdition)]
	]);
	assert.deepEqual(await fromOpenLibrary(ISBN, fetchFn), {
		title: 'Le Hobbit',
		publisher: 'Christian Bourgois',
		pageCount: 402,
		publishedYear: 2012,
		language: 'fr',
		coverUrl: `https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg?default=false`,
		olKey: OL_KEY
	});
	assert.deepEqual(calls.map(label), ['ol-data', 'ol-isbn']);
});

test('a malformed edition key is dropped rather than stored', async () => {
	const odd = { [`ISBN:${ISBN}`]: { title: 'The Hobbit', key: '/works/OL45883W' } };
	const { fetchFn } = stubFetch([[OPEN_LIBRARY_DATA, () => json(odd)]]);
	const metadata = await fromOpenLibrary(ISBN, fetchFn);
	// A work key is not an edition key: refreshing from it would land on a different record shape. No key beats a wrong key.
	assert.equal(metadata?.olKey, undefined);
});

test('the provider failing entirely yields null, which is a queued lookup and not an error', async () => {
	const { fetchFn } = stubFetch([]);
	assert.equal(await fetchBookMetadata(ISBN, fetchFn), null);
});

test('a fetch that rejects yields null, not a rejection', async () => {
	const fetchFn = (async () => {
		throw new TypeError('network down');
	}) as unknown as typeof fetch;
	assert.equal(await fetchBookMetadata(ISBN, fetchFn), null);
});

test('a body that is not JSON yields null', async () => {
	const { fetchFn } = stubFetch([
		[OPEN_LIBRARY_DATA, () => new Response('<html>maintenance</html>', { status: 200 })]
	]);
	assert.equal(await fetchBookMetadata(ISBN, fetchFn), null);
});

test('a blank ISBN asks nobody', async () => {
	const { fetchFn, calls } = stubFetch([]);
	assert.equal(await fetchBookMetadata('   ', fetchFn), null);
	assert.equal(calls.length, 0);
});
