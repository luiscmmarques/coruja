/**
 * Badge tests. Every threshold is tested from both sides — one below and exactly on — because an off-by-one here is a child told she has read five books when she has read four, or worse, denied a badge she earned.
 *
 * The negative cases carry as much weight as the positive ones: a badge that fires too eagerly cannot be taken back (guardrail #3), so "does not earn yet" is the assertion that protects the invariant.
 */

import { describe, expect, it } from 'vitest';
import type { Book, Reading } from './types.ts';
import { BADGES, newlyEarnedBadges, type BadgeDefinition } from './badges.ts';

const ME = 'reader-me';
const SIBLING = 'reader-sibling';

function badge(id: string): BadgeDefinition {
	const found = BADGES.find((b) => b.id === id);
	if (!found) throw new Error(`no badge with id ${id}`);
	return found;
}

function book(id: string, overrides: Partial<Book> = {}): Book {
	return {
		id,
		isbn13: `978000000000${id.length % 10}`,
		title: `Title ${id}`,
		authors: ['A Author'],
		addedAt: '2026-01-01T00:00:00.000Z',
		source: 'scan',
		...overrides
	};
}

function finished(bookId: string, readerId = ME): Reading {
	return {
		id: `done-${readerId}-${bookId}`,
		bookId,
		readerId,
		startedAt: '2026-01-01',
		finishedAt: '2026-01-08'
	};
}

function unfinished(bookId: string, readerId = ME): Reading {
	return { id: `open-${readerId}-${bookId}`, bookId, readerId, startedAt: '2026-01-01' };
}

/** `count` distinct finished books, each by its own author. */
function shelf(count: number, readerId = ME) {
	const books = Array.from({ length: count }, (_, i) =>
		book(`b${i}`, { authors: [`Author ${i}`] })
	);
	return { books, readings: books.map((b) => finished(b.id, readerId)) };
}

describe('the catalogue itself', () => {
	it('contains exactly the v1 ids', () => {
		expect(BADGES.map((b) => b.id)).toEqual([
			'first-book',
			'five-books',
			'ten-books',
			'twenty-books',
			'cataloguer',
			'doorstop',
			'five-authors',
			'two-tongues',
			'polyglot'
		]);
	});

	it('gives every badge a distinct id and a non-empty emoji', () => {
		expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
		for (const b of BADGES) expect(b.emoji.length).toBeGreaterThan(0);
	});
});

describe('first-book', () => {
	it('is not earned with nothing finished', () => {
		expect(badge('first-book').earned({ books: [], readings: [] }, ME)).toBe(false);
	});

	it('is not earned with a book only started', () => {
		const b = book('b1');
		expect(badge('first-book').earned({ books: [b], readings: [unfinished('b1')] }, ME)).toBe(
			false
		);
	});

	it('is earned with one finished', () => {
		expect(badge('first-book').earned(shelf(1), ME)).toBe(true);
	});
});

describe('volume badges', () => {
	it('five-books needs five', () => {
		expect(badge('five-books').earned(shelf(4), ME)).toBe(false);
		expect(badge('five-books').earned(shelf(5), ME)).toBe(true);
	});

	it('ten-books needs ten', () => {
		expect(badge('ten-books').earned(shelf(9), ME)).toBe(false);
		expect(badge('ten-books').earned(shelf(10), ME)).toBe(true);
	});

	it('twenty-books needs twenty', () => {
		expect(badge('twenty-books').earned(shelf(19), ME)).toBe(false);
		expect(badge('twenty-books').earned(shelf(20), ME)).toBe(true);
	});

	it('counts a re-read once', () => {
		const b = book('b1');
		const state = {
			books: [b],
			readings: [
				{ ...finished('b1'), id: 'first' },
				{ ...finished('b1'), id: 'second' }
			]
		};
		expect(badge('first-book').earned(state, ME)).toBe(true);
		expect(badge('five-books').earned(state, ME)).toBe(false);
	});
});

describe('cataloguer', () => {
	it('needs both a manual source and a missing ISBN', () => {
		const manualWithIsbn = book('b1', { source: 'manual', isbn13: '9780141187761' });
		const scannedWithout = book('b2', { source: 'scan', isbn13: undefined });
		const state = {
			books: [manualWithIsbn, scannedWithout],
			readings: [finished('b1'), finished('b2')]
		};
		expect(badge('cataloguer').earned(state, ME)).toBe(false);
	});

	it('is earned by a hand-added book the lookup did not know', () => {
		const homemade = book('b1', { source: 'manual', isbn13: undefined });
		expect(badge('cataloguer').earned({ books: [homemade], readings: [finished('b1')] }, ME)).toBe(
			true
		);
	});

	it('is not earned while that book is only on the shelf, unfinished', () => {
		const homemade = book('b1', { source: 'manual', isbn13: undefined });
		expect(
			badge('cataloguer').earned({ books: [homemade], readings: [unfinished('b1')] }, ME)
		).toBe(false);
	});
});

describe('doorstop', () => {
	it('is not earned without a page count', () => {
		const b = book('b1', { pageCount: undefined });
		expect(badge('doorstop').earned({ books: [b], readings: [finished('b1')] }, ME)).toBe(false);
	});

	it('is not earned at 399 pages', () => {
		const b = book('b1', { pageCount: 399 });
		expect(badge('doorstop').earned({ books: [b], readings: [finished('b1')] }, ME)).toBe(false);
	});

	it('is earned at exactly 400 pages', () => {
		const b = book('b1', { pageCount: 400 });
		expect(badge('doorstop').earned({ books: [b], readings: [finished('b1')] }, ME)).toBe(true);
	});

	it('is earned by a long book even among short ones', () => {
		const books = [book('b1', { pageCount: 32 }), book('b2', { pageCount: 812 })];
		expect(
			badge('doorstop').earned({ books, readings: [finished('b1'), finished('b2')] }, ME)
		).toBe(true);
	});
});

describe('five-authors', () => {
	it('needs five distinct authors', () => {
		expect(badge('five-authors').earned(shelf(4), ME)).toBe(false);
		expect(badge('five-authors').earned(shelf(5), ME)).toBe(true);
	});

	it('counts co-authors of one book separately', () => {
		const b = book('b1', { authors: ['One', 'Two', 'Three', 'Four', 'Five'] });
		expect(badge('five-authors').earned({ books: [b], readings: [finished('b1')] }, ME)).toBe(true);
	});

	it('counts the same author in different case and spacing once', () => {
		const books = [
			book('b1', { authors: ['Roald Dahl'] }),
			book('b2', { authors: ['roald dahl'] }),
			book('b3', { authors: ['  ROALD DAHL  '] }),
			book('b4', { authors: ['Quentin Blake'] })
		];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('five-authors').earned(state, ME)).toBe(false);
	});

	it('ignores blank author entries', () => {
		const books = [
			book('b1', { authors: ['One', '', '   '] }),
			book('b2', { authors: ['Two'] }),
			book('b3', { authors: ['Three'] }),
			book('b4', { authors: ['Four'] }),
			book('b5', { authors: ['Five'] })
		];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('five-authors').earned(state, ME)).toBe(true);
	});
});

describe('two-tongues', () => {
	it('is not earned in a single language', () => {
		const books = [book('b1', { language: 'en' }), book('b2', { language: 'en' })];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('two-tongues').earned(state, ME)).toBe(false);
	});

	it('ignores books with no language recorded', () => {
		const books = [
			book('b1', { language: 'en' }),
			book('b2', { language: undefined }),
			book('b3', { language: undefined })
		];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('two-tongues').earned(state, ME)).toBe(false);
	});

	it('is earned across two languages', () => {
		const books = [book('b1', { language: 'en' }), book('b2', { language: 'fr' })];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('two-tongues').earned(state, ME)).toBe(true);
	});

	it('treats case and padding as the same language', () => {
		const books = [book('b1', { language: 'EN' }), book('b2', { language: ' en ' })];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('two-tongues').earned(state, ME)).toBe(false);
	});
});

describe('polyglot', () => {
	it('is not earned with two languages', () => {
		const books = [book('b1', { language: 'de' }), book('b2', { language: 'pt' })];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('polyglot').earned(state, ME)).toBe(false);
	});

	it('is earned with three languages, whatever their casing', () => {
		// The household this badge is for: German, Portuguese and French on one shelf.
		const books = [
			book('b1', { language: 'de' }),
			book('b2', { language: 'PT' }),
			book('b3', { language: 'fr' })
		];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(badge('polyglot').earned(state, ME)).toBe(true);
	});

	it('does not count unfinished or language-less books towards the three', () => {
		const books = [
			book('b1', { language: 'de' }),
			book('b2', { language: 'pt' }),
			book('b3', { language: 'fr' }),
			book('b4')
		];
		const readings = [finished('b1'), finished('b2'), unfinished('b3'), finished('b4')];
		expect(badge('polyglot').earned({ books, readings }, ME)).toBe(false);
	});
});

describe('another reader', () => {
	it('earns nothing for me, however much they read', () => {
		const state = shelf(20, SIBLING);
		for (const b of BADGES) {
			expect(b.earned(state, ME), `${b.id} must not fire for a non-reader`).toBe(false);
		}
	});

	it('does not let a sibling\u2019s cataloguer book count for me', () => {
		const homemade = book('b1', { source: 'manual', isbn13: undefined });
		const state = { books: [homemade], readings: [finished('b1', SIBLING)] };
		expect(badge('cataloguer').earned(state, ME)).toBe(false);
		expect(badge('cataloguer').earned(state, SIBLING)).toBe(true);
	});
});

describe('newlyEarnedBadges', () => {
	it('returns nothing for an empty shelf', () => {
		expect(newlyEarnedBadges({ books: [], readings: [] }, ME, [])).toEqual([]);
	});

	it('returns everything newly qualified, in catalogue order', () => {
		const books = [
			book('b1', { authors: ['One'], language: 'en', pageCount: 500 }),
			book('b2', { authors: ['Two'], language: 'fr', source: 'manual', isbn13: undefined }),
			book('b3', { authors: ['Three'] }),
			book('b4', { authors: ['Four'] }),
			book('b5', { authors: ['Five'] })
		];
		const state = { books, readings: books.map((b) => finished(b.id)) };
		expect(newlyEarnedBadges(state, ME, []).map((b) => b.id)).toEqual([
			'first-book',
			'five-books',
			'cataloguer',
			'doorstop',
			'five-authors',
			'two-tongues'
		]);
	});

	it('excludes ids already earned', () => {
		const state = shelf(5);
		expect(newlyEarnedBadges(state, ME, ['first-book']).map((b) => b.id)).toEqual([
			'five-books',
			'five-authors'
		]);
		expect(newlyEarnedBadges(state, ME, ['first-book', 'five-books', 'five-authors'])).toEqual([]);
	});

	it('ignores stored ids that are no longer in the catalogue', () => {
		const state = shelf(1);
		expect(newlyEarnedBadges(state, ME, ['retired-badge']).map((b) => b.id)).toEqual([
			'first-book'
		]);
	});

	it('never proposes removing a badge — it only ever returns additions', () => {
		// Guardrail #3, expressed as a test: a reader holding every badge with an empty shelf (data since corrected) gets an empty result, not a revocation list.
		const held = BADGES.map((b) => b.id);
		expect(newlyEarnedBadges({ books: [], readings: [] }, ME, held)).toEqual([]);
	});
});
