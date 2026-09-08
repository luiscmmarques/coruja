/**
 * What the providers actually answer, and what we turn it into.
 *
 * The point of these tests is the mapping, the request order and the merge, so `fetchFn` is injected rather than the global patched: no network, no `vi.mock`, no ordering hazard between suites. Assertions use `node:assert/strict` to match the domain suite — the mapping is data logic, and data logic should not need a test framework's matchers.
 *
 * The fixtures are trimmed copies of real responses, keeping the fields that trip people up: `publish_date: 'May 1, 2003'`, a MARC language key, an edition key, an unknown ISBN answering `200 {}` rather than a 404, and Google answering two items for one ISBN with `http://` thumbnails.
 *
 * Every call injects `instantly` for the pace gate — the real one sleeps to honour Open Library's 1 req/s limit, which is exactly what a test suite must not do. The gate's arithmetic is tested separately through `paceDelay`.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fetchBookMetadata, fromGoogleBooks, fromOpenLibrary, paceDelay } from './lookup.ts';

const ISBN = '9780261103344';
const OL_KEY = '/books/OL26331930M';
const GOOGLE_KEY = 'test-api-key';

/** A no-op pace: the tests assert the gate is consulted, not that it sleeps. */
const instantly = async () => {};

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
const GOOGLE_VOLUMES = /googleapis\.com\/books\/v1\/volumes/;

/** Which endpoint a recorded URL went to, so call order reads as a list of names. */
function label(url: string): string {
	if (OPEN_LIBRARY_DATA.test(url)) return 'ol-data';
	if (OPEN_LIBRARY_EDITION_KEY.test(url)) return 'ol-edition-key';
	if (OPEN_LIBRARY_ISBN.test(url)) return 'ol-isbn';
	if (GOOGLE_VOLUMES.test(url)) return 'google';
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

/**
 * A trimmed real answer: two items for one ISBN (observed live), the matching one second, thumbnails on `http://`, and the language already an ISO tag.
 */
const googleVolumes = {
	kind: 'books#volumes',
	totalItems: 2,
	items: [
		{
			volumeInfo: {
				title: 'The Hobbit, Or, There and Back Again',
				industryIdentifiers: [{ type: 'ISBN_13', identifier: '9999999999999' }],
				language: 'en'
			}
		},
		{
			volumeInfo: {
				title: 'The Hobbit',
				authors: ['J.R.R. Tolkien'],
				publisher: 'HarperCollins',
				publishedDate: '2003-05-01',
				industryIdentifiers: [
					{ type: 'ISBN_10', identifier: '0261103342' },
					{ type: 'ISBN_13', identifier: ISBN }
				],
				pageCount: 366,
				imageLinks: {
					smallThumbnail:
						'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=5',
					thumbnail: 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1'
				},
				language: 'en'
			}
		}
	]
};

/* ---------------------------------------------------------------------- Open Library */

test('the data endpoint maps, and the edition record supplies the language it lacks', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(openLibraryData)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)]
	]);

	assert.deepEqual(await fromOpenLibrary(ISBN, fetchFn, instantly), {
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

	const metadata = await fromOpenLibrary(ISBN, fetchFn, instantly);
	assert.equal(metadata?.title, 'The Hobbit');
	assert.equal(metadata?.language, undefined);
	assert.equal(metadata?.olKey, OL_KEY);
});

test('a record with no cover falls back to the OLID cover URL, which is not rate-limited', async () => {
	const bare = { [`ISBN:${ISBN}`]: { title: 'The Hobbit', key: OL_KEY } };
	const { fetchFn } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(bare)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)]
	]);
	const metadata = await fromOpenLibrary(ISBN, fetchFn, instantly);
	// The covers API caps ISBN-keyed requests at 100/IP per 5 minutes; OLID-keyed ones are unlimited, and the record supplied its OLID.
	assert.equal(
		metadata?.coverUrl,
		'https://covers.openlibrary.org/b/olid/OL26331930M-M.jpg?default=false'
	);
});

test('with no cover and no edition key, the covers-by-ISBN URL is the last resort', async () => {
	const bare = { [`ISBN:${ISBN}`]: { title: 'The Hobbit' } };
	const { fetchFn } = stubFetch([[OPEN_LIBRARY_DATA, () => json(bare)]]);
	const metadata = await fromOpenLibrary(ISBN, fetchFn, instantly);
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
		(await fromOpenLibrary(ISBN, kept.fetchFn, instantly))?.coverUrl,
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
		(await fromOpenLibrary(ISBN, swapped.fetchFn, instantly))?.coverUrl,
		`https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg?default=false`
	);
});

test('an unknown ISBN yields null after exactly one request', async () => {
	const { fetchFn, calls } = stubFetch([[OPEN_LIBRARY_DATA, () => json({})]]);
	assert.equal(await fromOpenLibrary(ISBN, fetchFn, instantly), null);
	// Both /isbn/ and the data view share edition records: a book the data endpoint definitively does not know would only produce a guaranteed 404 elsewhere.
	assert.deepEqual(calls.map(label), ['ol-data']);
});

test('the /isbn/ endpoint is a fallback for a failed request, not an unknown book', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => new Response(null, { status: 503 })],
		[OPEN_LIBRARY_ISBN, () => json(openLibraryEdition)]
	]);
	assert.deepEqual(await fromOpenLibrary(ISBN, fetchFn, instantly), {
		title: 'Le Hobbit',
		publisher: 'Christian Bourgois',
		pageCount: 402,
		publishedYear: 2012,
		language: 'fr',
		coverUrl: 'https://covers.openlibrary.org/b/olid/OL26331930M-M.jpg?default=false',
		olKey: OL_KEY
	});
	assert.deepEqual(calls.map(label), ['ol-data', 'ol-isbn']);
});

test('a malformed edition key is dropped rather than stored', async () => {
	const odd = { [`ISBN:${ISBN}`]: { title: 'The Hobbit', key: '/works/OL45883W' } };
	const { fetchFn } = stubFetch([[OPEN_LIBRARY_DATA, () => json(odd)]]);
	const metadata = await fromOpenLibrary(ISBN, fetchFn, instantly);
	// A work key is not an edition key: refreshing from it would land on a different record shape. No key beats a wrong key.
	assert.equal(metadata?.olKey, undefined);
});

/* ------------------------------------------------------------------------- pacing */

test('every Open Library request passes through the pace gate', async () => {
	let paced = 0;
	const gate = async () => {
		paced += 1;
	};
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(openLibraryData)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)]
	]);
	await fromOpenLibrary(ISBN, fetchFn, gate);
	assert.equal(paced, calls.length);
});

test('paceDelay books one slot per second and never asks for a negative wait', () => {
	// First request of a session: the slot is in the past, so no wait, and the next request is booked one interval out.
	assert.deepEqual(paceDelay(0, 5_000, 1_000), { wait: 0, next: 6_000 });
	// A request arriving while the slot is still ahead waits for it.
	assert.deepEqual(paceDelay(6_000, 5_200, 1_000), { wait: 800, next: 7_000 });
	// Back-to-back burst: each caller queues a full interval behind the previous one.
	assert.deepEqual(paceDelay(7_000, 5_200, 1_000), { wait: 1_800, next: 8_000 });
});

/* ---------------------------------------------------------------------- Google Books */

test('Google maps the volume that claims the ISBN, not the first item', async () => {
	const { fetchFn } = stubFetch([[GOOGLE_VOLUMES, () => json(googleVolumes)]]);
	assert.deepEqual(await fromGoogleBooks(ISBN, GOOGLE_KEY, fetchFn), {
		title: 'The Hobbit',
		authors: ['J.R.R. Tolkien'],
		publisher: 'HarperCollins',
		pageCount: 366,
		publishedYear: 2003,
		language: 'en',
		// The thumbnail arrives on http:// and is upgraded; connect-src only knows https.
		coverUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1'
	});
});

test('when no volume claims the ISBN, the first item is better than nothing', async () => {
	const unclaimed = {
		items: [{ volumeInfo: { title: 'O Principezinho', language: 'pt' } }]
	};
	const { fetchFn } = stubFetch([[GOOGLE_VOLUMES, () => json(unclaimed)]]);
	const metadata = await fromGoogleBooks(ISBN, GOOGLE_KEY, fetchFn);
	assert.equal(metadata?.title, 'O Principezinho');
	assert.equal(metadata?.language, 'pt');
});

test('a regional language tag is reduced to its base, and a junk tag is dropped', async () => {
	const regional = {
		items: [
			{
				volumeInfo: {
					title: 'O Menino Maluquinho',
					industryIdentifiers: [{ type: 'ISBN_13', identifier: ISBN }],
					language: 'pt-BR'
				}
			}
		]
	};
	const { fetchFn } = stubFetch([[GOOGLE_VOLUMES, () => json(regional)]]);
	assert.equal((await fromGoogleBooks(ISBN, GOOGLE_KEY, fetchFn))?.language, 'pt');

	const junk = {
		items: [
			{
				volumeInfo: {
					title: 'Mystery',
					industryIdentifiers: [{ type: 'ISBN_13', identifier: ISBN }],
					language: 'und?!'
				}
			}
		]
	};
	const dropped = stubFetch([[GOOGLE_VOLUMES, () => json(junk)]]);
	assert.equal((await fromGoogleBooks(ISBN, GOOGLE_KEY, dropped.fetchFn))?.language, undefined);
});

test('a cover URL on a foreign origin is dropped, not stored for the CSP to block', async () => {
	const foreign = {
		items: [
			{
				volumeInfo: {
					title: 'The Hobbit',
					industryIdentifiers: [{ type: 'ISBN_13', identifier: ISBN }],
					imageLinks: { thumbnail: 'http://example.com/cover.jpg' }
				}
			}
		]
	};
	const { fetchFn } = stubFetch([[GOOGLE_VOLUMES, () => json(foreign)]]);
	assert.equal((await fromGoogleBooks(ISBN, GOOGLE_KEY, fetchFn))?.coverUrl, undefined);
});

test('an empty Google answer is null', async () => {
	const { fetchFn } = stubFetch([[GOOGLE_VOLUMES, () => json({ totalItems: 0 })]]);
	assert.equal(await fromGoogleBooks(ISBN, GOOGLE_KEY, fetchFn), null);
});

/* -------------------------------------------------------------------------- the merge */

test('a complete Open Library answer never costs a Google request', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(openLibraryData)],
		[OPEN_LIBRARY_EDITION_KEY, () => json(openLibraryEditionRecord)],
		[GOOGLE_VOLUMES, () => json(googleVolumes)]
	]);
	const metadata = await fetchBookMetadata(ISBN, {
		fetchFn,
		googleBooksKey: GOOGLE_KEY,
		pace: instantly
	});
	assert.equal(metadata?.publisher, 'Houghton Mifflin');
	// The quota protection is the design: Google is only asked when Open Library falls short.
	assert.deepEqual(calls.map(label), ['ol-data', 'ol-edition-key']);
});

test('Google fills the gaps Open Library left, and Open Library wins where both answer', async () => {
	// A thin Open Library record: title and cover, no authors, pages, publisher, year or language.
	const thin = {
		[`ISBN:${ISBN}`]: {
			title: 'The Hobbit (OL)',
			key: OL_KEY,
			cover: { medium: 'https://covers.openlibrary.org/b/id/8406786-M.jpg' }
		}
	};
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json(thin)],
		[OPEN_LIBRARY_EDITION_KEY, () => new Response(null, { status: 404 })],
		[GOOGLE_VOLUMES, () => json(googleVolumes)]
	]);
	assert.deepEqual(
		await fetchBookMetadata(ISBN, { fetchFn, googleBooksKey: GOOGLE_KEY, pace: instantly }),
		{
			// Open Library's own fields survive the merge untouched…
			title: 'The Hobbit (OL)',
			coverUrl: 'https://covers.openlibrary.org/b/id/8406786-M.jpg',
			olKey: OL_KEY,
			// …and Google supplied only what was missing.
			authors: ['J.R.R. Tolkien'],
			publisher: 'HarperCollins',
			pageCount: 366,
			publishedYear: 2003,
			language: 'en'
		}
	);
	assert.deepEqual(calls.map(label), ['ol-data', 'ol-edition-key', 'google']);
});

test('a book Open Library does not know comes entirely from Google', async () => {
	const { fetchFn, calls } = stubFetch([
		[OPEN_LIBRARY_DATA, () => json({})],
		[GOOGLE_VOLUMES, () => json(googleVolumes)]
	]);
	const metadata = await fetchBookMetadata(ISBN, {
		fetchFn,
		googleBooksKey: GOOGLE_KEY,
		pace: instantly
	});
	assert.equal(metadata?.title, 'The Hobbit');
	assert.equal(metadata?.olKey, undefined);
	assert.deepEqual(calls.map(label), ['ol-data', 'google']);
});

test('without a key, Google is never asked, gaps or no gaps', async () => {
	const { fetchFn, calls } = stubFetch([[OPEN_LIBRARY_DATA, () => json({})]]);
	assert.equal(await fetchBookMetadata(ISBN, { fetchFn, pace: instantly }), null);
	assert.deepEqual(calls.map(label), ['ol-data']);
});

/* ----------------------------------------------------------------------- flat failures */

test('every provider failing yields null, which is a queued lookup and not an error', async () => {
	const { fetchFn } = stubFetch([]);
	assert.equal(
		await fetchBookMetadata(ISBN, { fetchFn, googleBooksKey: GOOGLE_KEY, pace: instantly }),
		null
	);
});

test('a fetch that rejects yields null, not a rejection', async () => {
	const fetchFn = (async () => {
		throw new TypeError('network down');
	}) as unknown as typeof fetch;
	assert.equal(await fetchBookMetadata(ISBN, { fetchFn, pace: instantly }), null);
});

test('a body that is not JSON yields null', async () => {
	const { fetchFn } = stubFetch([
		[OPEN_LIBRARY_DATA, () => new Response('<html>maintenance</html>', { status: 200 })]
	]);
	assert.equal(await fetchBookMetadata(ISBN, { fetchFn, pace: instantly }), null);
});

test('a blank ISBN asks nobody', async () => {
	const { fetchFn, calls } = stubFetch([]);
	assert.equal(
		await fetchBookMetadata('   ', { fetchFn, googleBooksKey: GOOGLE_KEY, pace: instantly }),
		null
	);
	assert.equal(calls.length, 0);
});
