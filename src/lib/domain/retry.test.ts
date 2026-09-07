import assert from 'node:assert/strict';
import { test } from 'vitest';
import { lookupCooldownMs, MAX_LOOKUP_ATTEMPTS, shouldRetryLookup } from './retry.ts';
import type { PendingLookup } from './types.ts';

const NOW = Date.parse('2026-09-05T12:00:00.000Z');

function pending(overrides: Partial<PendingLookup>): PendingLookup {
	return {
		isbn13: '9780306406157',
		bookId: 'book-1',
		queuedAt: '2026-09-01T00:00:00.000Z',
		attempts: 1,
		...overrides
	};
}

test('a never-tried entry is retried immediately', () => {
	assert.equal(shouldRetryLookup(pending({ attempts: 0 }), NOW), true);
	assert.equal(shouldRetryLookup(pending({ attempts: 3 }), NOW), true);
});

test('an entry tried a moment ago is not retried', () => {
	const justNow = new Date(NOW - 1000).toISOString();
	assert.equal(shouldRetryLookup(pending({ attempts: 1, lastTriedAt: justNow }), NOW), false);
});

test('an entry past its cooldown is retried', () => {
	const longAgo = new Date(NOW - lookupCooldownMs(1) - 1).toISOString();
	assert.equal(shouldRetryLookup(pending({ attempts: 1, lastTriedAt: longAgo }), NOW), true);
});

test('the cooldown doubles per attempt and caps at a day', () => {
	assert.equal(lookupCooldownMs(1), 30 * 60 * 1000);
	assert.equal(lookupCooldownMs(2), 60 * 60 * 1000);
	assert.equal(lookupCooldownMs(3), 2 * 60 * 60 * 1000);
	assert.equal(lookupCooldownMs(7), 24 * 60 * 60 * 1000);
	assert.equal(lookupCooldownMs(100), 24 * 60 * 60 * 1000);
});

test('the attempt cap ends automatic retries, however long ago the last try was', () => {
	const years = new Date(NOW - 365 * 24 * 60 * 60 * 1000).toISOString();
	const capped = pending({ attempts: MAX_LOOKUP_ATTEMPTS, lastTriedAt: years });
	assert.equal(shouldRetryLookup(capped, NOW), false);
});

test('an unparseable lastTriedAt fails open — one wasted request beats a stranded book', () => {
	assert.equal(shouldRetryLookup(pending({ attempts: 2, lastTriedAt: 'garbage' }), NOW), true);
});
