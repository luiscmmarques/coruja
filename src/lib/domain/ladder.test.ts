/**
 * Ladder tests. The two that matter most are the re-read (a book finished twice is one rung, not two) and the cap (twenty-five books is still rung twenty, and the count keeps counting) — both are places where a plausible-looking implementation is wrong.
 */

import { describe, expect, it } from 'vitest';
import type { Reading } from './types.ts';
import { LADDER_SIZE, RUNG_EMOJI, ladderPosition } from './ladder.ts';

const ME = 'reader-me';
const SIBLING = 'reader-sibling';

function finished(bookId: string, readerId = ME, id = `r-${readerId}-${bookId}`): Reading {
	return { id, bookId, readerId, startedAt: '2026-01-01', finishedAt: '2026-01-08' };
}

function reading(bookId: string, readerId = ME): Reading {
	return { id: `open-${readerId}-${bookId}`, bookId, readerId, startedAt: '2026-01-01' };
}

/** `count` finished readings of distinct books. */
function finishedBooks(count: number, readerId = ME): Reading[] {
	return Array.from({ length: count }, (_, i) => finished(`book-${i}`, readerId));
}

describe('RUNG_EMOJI', () => {
	it('has one entry per rung plus the not-started rung', () => {
		expect(RUNG_EMOJI).toHaveLength(LADDER_SIZE + 1);
	});

	it('has no duplicates — every rung looks different', () => {
		expect(new Set(RUNG_EMOJI).size).toBe(RUNG_EMOJI.length);
	});

	it('has a non-empty emoji at every rung', () => {
		for (const emoji of RUNG_EMOJI) expect(emoji.length).toBeGreaterThan(0);
	});
});

describe('ladderPosition', () => {
	it('starts at rung 0 with no readings at all', () => {
		expect(ladderPosition([], ME)).toEqual({
			finished: 0,
			rung: 0,
			emoji: RUNG_EMOJI[0],
			isFull: false
		});
	});

	it('is rung 1 after one finished book', () => {
		const position = ladderPosition([finished('book-a')], ME);
		expect(position.finished).toBe(1);
		expect(position.rung).toBe(1);
		expect(position.emoji).toBe(RUNG_EMOJI[1]);
		expect(position.isFull).toBe(false);
	});

	it('counts a re-read of the same book once', () => {
		const readings: Reading[] = [
			finished('book-a', ME, 'first-time'),
			finished('book-a', ME, 'second-time')
		];
		const position = ladderPosition(readings, ME);
		expect(position.finished).toBe(1);
		expect(position.rung).toBe(1);
	});

	it('is full at exactly twenty books', () => {
		const position = ladderPosition(finishedBooks(LADDER_SIZE), ME);
		expect(position.finished).toBe(20);
		expect(position.rung).toBe(LADDER_SIZE);
		expect(position.emoji).toBe(RUNG_EMOJI[LADDER_SIZE]);
		expect(position.isFull).toBe(true);
	});

	it('is not yet full at nineteen books', () => {
		const position = ladderPosition(finishedBooks(19), ME);
		expect(position.rung).toBe(19);
		expect(position.isFull).toBe(false);
	});

	it('caps the rung at twenty while the count keeps counting', () => {
		const position = ladderPosition(finishedBooks(25), ME);
		expect(position.finished).toBe(25);
		expect(position.rung).toBe(LADDER_SIZE);
		expect(position.emoji).toBe(RUNG_EMOJI[LADDER_SIZE]);
		expect(position.isFull).toBe(true);
	});

	it('ignores another reader\u2019s readings', () => {
		const readings = [...finishedBooks(3, SIBLING), finished('mine', ME)];
		expect(ladderPosition(readings, ME).finished).toBe(1);
		expect(ladderPosition(readings, SIBLING).finished).toBe(3);
	});

	it('gives a reader with only other people\u2019s readings rung 0', () => {
		expect(ladderPosition(finishedBooks(5, SIBLING), ME).rung).toBe(0);
	});

	it('ignores readings that are still in progress', () => {
		const readings = [finished('done'), reading('in-progress'), reading('also-in-progress')];
		expect(ladderPosition(readings, ME).finished).toBe(1);
	});

	it('goes back down when a finish is undone, without complaint', () => {
		const before = ladderPosition([finished('a'), finished('b')], ME);
		const after = ladderPosition([finished('a'), reading('b')], ME);
		expect(before.rung).toBe(2);
		expect(after.rung).toBe(1);
	});
});
