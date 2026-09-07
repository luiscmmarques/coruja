import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
	familyFinishedBookCount,
	familyPagesRead,
	finishedInYear,
	longestFinished,
	monthlyPace,
	pagesRead,
	rereadCount,
	shelfReadPercent
} from './stats.ts';
import type { Book, Reading } from './types.ts';

function book(id: string, pageCount?: number): Book {
	return {
		id,
		title: id,
		authors: [],
		addedAt: '2026-01-01T00:00:00.000Z',
		source: 'scan',
		pageCount
	};
}

function finished(
	bookId: string,
	readerId: string,
	id = `${bookId}-${readerId}-${Math.random()}`
): Reading {
	return {
		id,
		bookId,
		readerId,
		startedAt: '2026-02-01T00:00:00.000Z',
		finishedAt: '2026-02-02T00:00:00.000Z'
	};
}

const BOOKS = [book('petit-prince', 95), book('hobbit', 366), book('no-pages')];

test('pages sum over finished readings, and a re-read counts its pages again', () => {
	const readings = [
		finished('petit-prince', 'sofia'),
		finished('petit-prince', 'sofia'), // re-read: 95 more real pages
		finished('hobbit', 'sofia')
	];
	assert.equal(pagesRead(readings, BOOKS, 'sofia'), 95 + 95 + 366);
});

test('an unfinished reading and another reader contribute no pages', () => {
	const open: Reading = {
		id: 'r1',
		bookId: 'hobbit',
		readerId: 'sofia',
		startedAt: '2026-02-01T00:00:00.000Z'
	};
	const readings = [open, finished('petit-prince', 'papa')];
	assert.equal(pagesRead(readings, BOOKS, 'sofia'), 0);
});

test('a book without a page count contributes nothing rather than a guess', () => {
	assert.equal(pagesRead([finished('no-pages', 'sofia')], BOOKS, 'sofia'), 0);
});

test('re-reads are finishes beyond the first per book, per reader', () => {
	const readings = [
		finished('petit-prince', 'sofia'),
		finished('petit-prince', 'sofia'),
		finished('petit-prince', 'sofia'),
		finished('hobbit', 'sofia'),
		finished('petit-prince', 'papa') // papa's first read is not sofia's re-read
	];
	assert.equal(rereadCount(readings, 'sofia'), 2);
	assert.equal(rereadCount(readings, 'papa'), 0);
});

test('the family counts distinct books once, but every page turned', () => {
	const readings = [
		finished('petit-prince', 'sofia'),
		finished('petit-prince', 'papa') // same book, both readers
	];
	assert.equal(familyFinishedBookCount(readings), 1);
	assert.equal(familyPagesRead(readings, BOOKS), 190);
});

test('pace hides until the history spans four weeks — a first-week average only falls', () => {
	const now = Date.parse('2026-03-01T00:00:00.000Z');
	const young: Reading = {
		id: 'r-young',
		bookId: 'petit-prince',
		readerId: 'sofia',
		startedAt: '2026-02-20T00:00:00.000Z',
		finishedAt: '2026-02-25T00:00:00.000Z'
	};
	assert.equal(monthlyPace([young], BOOKS, 'sofia', now), null);
	assert.equal(monthlyPace([], BOOKS, 'sofia', now), null);
});

test('pace averages distinct books but every page over the elapsed months', () => {
	const now = Date.parse('2026-05-01T00:00:00.000Z');
	const first = '2026-02-01T00:00:00.000Z'; // ~89 days ≈ 2.92 months before now
	const readings = [
		{ id: 'a', bookId: 'petit-prince', readerId: 'sofia', startedAt: first, finishedAt: first },
		{
			id: 'b',
			bookId: 'petit-prince',
			readerId: 'sofia',
			startedAt: '2026-03-01T00:00:00.000Z',
			finishedAt: '2026-03-01T00:00:00.000Z' // re-read: pages again, book once
		},
		{
			id: 'c',
			bookId: 'hobbit',
			readerId: 'sofia',
			startedAt: '2026-04-01T00:00:00.000Z',
			finishedAt: '2026-04-01T00:00:00.000Z'
		}
	];
	const pace = monthlyPace(readings, BOOKS, 'sofia', now);
	assert.ok(pace);
	const months = (now - Date.parse(first)) / (24 * 60 * 60 * 1000) / 30.44;
	assert.ok(Math.abs(pace.booksPerMonth - 2 / months) < 1e-9);
	assert.ok(Math.abs(pace.pagesPerMonth - (95 + 95 + 366) / months) < 1e-9);
});

test('shelf percent counts only books still on the shelf, and null with no books', () => {
	const readings = [finished('petit-prince', 'sofia'), finished('gone-book', 'sofia')];
	// 'gone-book' was deleted; 3 books on the shelf, 1 of them finished.
	assert.equal(shelfReadPercent(readings, BOOKS, 'sofia'), 33);
	assert.equal(shelfReadPercent(readings, [], 'sofia'), null);
});

test('family shelf percent passes null reader and counts anyone', () => {
	const readings = [finished('petit-prince', 'sofia'), finished('hobbit', 'papa')];
	assert.equal(shelfReadPercent(readings, BOOKS, null), 67);
});

test('finished-in-year counts distinct books with a finish in that calendar year', () => {
	const readings: Reading[] = [
		{
			id: 'a',
			bookId: 'petit-prince',
			readerId: 'sofia',
			startedAt: '2025-12-28T00:00:00.000Z',
			finishedAt: '2026-01-02T00:00:00.000Z' // finished in 2026, started in 2025
		},
		{
			id: 'b',
			bookId: 'hobbit',
			readerId: 'sofia',
			startedAt: '2025-06-01T00:00:00.000Z',
			finishedAt: '2025-06-20T00:00:00.000Z' // last year
		},
		{
			id: 'c',
			bookId: 'petit-prince',
			readerId: 'sofia',
			startedAt: '2026-03-01T00:00:00.000Z',
			finishedAt: '2026-03-02T00:00:00.000Z' // re-read in the same year: still one book
		}
	];
	assert.equal(finishedInYear(readings, 'sofia', 2026), 1);
	assert.equal(finishedInYear(readings, 'sofia', 2025), 1);
	assert.equal(finishedInYear(readings, 'papa', 2026), 0);
});

test('the longest finished book wins by page count, and pageless books cannot win', () => {
	const readings = [
		finished('petit-prince', 'sofia'),
		finished('hobbit', 'sofia'),
		finished('no-pages', 'sofia')
	];
	assert.deepEqual(longestFinished(readings, BOOKS, 'sofia'), {
		title: 'hobbit',
		pageCount: 366
	});
	assert.equal(longestFinished([finished('no-pages', 'sofia')], BOOKS, 'sofia'), null);
	assert.equal(longestFinished([], BOOKS, 'sofia'), null);
});
