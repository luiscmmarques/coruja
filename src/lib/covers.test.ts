/**
 * The retry decision, which is the whole point of `covers.ts`.
 *
 * Every case here is one row of the outcome table in that module's header, and the assertion that matters is never "did we get an image" but **which of the two failures** we got: `gone` costs a book its cover forever, `failed` costs it one more attempt. Getting that wrong in either direction is invisible until a family notices half a shelf has no pictures.
 *
 * `fetchFn` is injected, so nothing here touches the network. `node:assert/strict` to match the rest of the suite.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fetchCoverImage } from './covers.ts';

const URL_ = 'https://covers.openlibrary.org/b/olid/OL8840824M-M.jpg?default=false';

/** A `fetch` that answers with one canned response, whatever it is asked. */
function answering(response: Response): typeof fetch {
	return (async () => response) as unknown as typeof fetch;
}

/** A `fetch` that fails the way an offline device or a CORS refusal does: it throws. */
function throwing(): typeof fetch {
	return (async () => {
		throw new TypeError('Failed to fetch');
	}) as unknown as typeof fetch;
}

function image(bytes = 4): Response {
	return new Response(new Uint8Array(bytes), {
		status: 200,
		headers: { 'content-type': 'image/jpeg' }
	});
}

test('an image is returned with its bytes', async () => {
	const result = await fetchCoverImage(URL_, answering(image()));
	assert.equal(result.outcome, 'image');
	assert.equal(result.outcome === 'image' && result.blob.size, 4);
});

test('404 is gone: Open Library saying it has no cover for this edition', async () => {
	const result = await fetchCoverImage(URL_, answering(new Response('', { status: 404 })));
	assert.deepEqual(result, { outcome: 'gone' });
});

test('403 is gone: a considered refusal, not a bad minute', async () => {
	const result = await fetchCoverImage(URL_, answering(new Response('', { status: 403 })));
	assert.deepEqual(result, { outcome: 'gone' });
});

test('500 is failed: the provider is having a bad minute, so try again', async () => {
	const result = await fetchCoverImage(URL_, answering(new Response('', { status: 500 })));
	assert.deepEqual(result, { outcome: 'failed' });
});

test('429 is failed: rate-limited now does not mean coverless forever', async () => {
	const result = await fetchCoverImage(URL_, answering(new Response('', { status: 429 })));
	assert.deepEqual(result, { outcome: 'failed' });
});

/*
 * The case that made this module exist: books.google.com serves cover bytes with no
 * `Access-Control-Allow-Origin`, so the browser rejects the read and `fetch` throws.
 * It must be `failed` — nothing was learnt about whether the image exists, and the
 * Worker proxy in TODO.md is what will make the same URL work.
 */
test('a thrown request is failed: offline, timed out, or refused cross-origin', async () => {
	const result = await fetchCoverImage(URL_, throwing());
	assert.deepEqual(result, { outcome: 'failed' });
});

test('an empty 200 body is gone, not an image', async () => {
	const result = await fetchCoverImage(URL_, answering(image(0)));
	assert.deepEqual(result, { outcome: 'gone' });
});

test('a 200 that is not an image is gone: a placeholder stored once is stored forever', async () => {
	const html = new Response('<html>not here</html>', {
		status: 200,
		headers: { 'content-type': 'text/html' }
	});
	const result = await fetchCoverImage(URL_, answering(html));
	assert.deepEqual(result, { outcome: 'gone' });
});
