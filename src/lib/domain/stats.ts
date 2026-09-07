/**
 * Reading statistics, derived — like everything else — from books and readings.
 *
 * Two different counting rules coexist here, on purpose:
 *
 * - **Books count distinct titles** (`finishedBookCount` in types.ts): the ladder and
 *   the "x books" figures cannot be climbed by finishing the same thin favourite
 *   twenty times. An eight-year-old will discover that exploit if it exists.
 * - **Pages count every finished reading**, re-reads included: reading Le Petit Prince
 *   twice genuinely turned 190 pages, and pages are a fact about reading done, not a
 *   reward to game. A book with no page count contributes nothing rather than a guess.
 */

import { finishedBookCount, type Book, type Reading } from './types.ts';

/** Pages turned by `readerId` across all finished readings, re-reads included. */
export function pagesRead(
	readings: readonly Reading[],
	books: readonly Book[],
	readerId: string
): number {
	const pageCountOf = new Map(books.map((b) => [b.id, b.pageCount ?? 0]));
	let total = 0;
	for (const r of readings) {
		if (r.readerId === readerId && r.finishedAt) total += pageCountOf.get(r.bookId) ?? 0;
	}
	return total;
}

/** Finished readings beyond the first per book — how often this reader came back. */
export function rereadCount(readings: readonly Reading[], readerId: string): number {
	const finishesPerBook = new Map<string, number>();
	for (const r of readings) {
		if (r.readerId === readerId && r.finishedAt) {
			finishesPerBook.set(r.bookId, (finishesPerBook.get(r.bookId) ?? 0) + 1);
		}
	}
	let rereads = 0;
	for (const count of finishesPerBook.values()) rereads += count - 1;
	return rereads;
}

/** Distinct books finished by anyone in the household. */
export function familyFinishedBookCount(readings: readonly Reading[]): number {
	const finished = new Set<string>();
	for (const r of readings) {
		if (r.finishedAt) finished.add(r.bookId);
	}
	return finished.size;
}

/** Pages turned by the whole household, every finished reading of every reader. */
export function familyPagesRead(readings: readonly Reading[], books: readonly Book[]): number {
	const pageCountOf = new Map(books.map((b) => [b.id, b.pageCount ?? 0]));
	let total = 0;
	for (const r of readings) {
		if (r.finishedAt) total += pageCountOf.get(r.bookId) ?? 0;
	}
	return total;
}

const AVERAGE_MONTH_DAYS = 30.44;

/** Below this span an average is an extrapolation, not a fact: hide it. */
export const MIN_PACE_DAYS = 28;

/**
 * Reading pace: books and pages per month, averaged from the first finish to `nowMs`.
 *
 * Returns `null` until the history spans MIN_PACE_DAYS — five books in the first
 * excited week would otherwise read as "20 books a month", a number that can only
 * fall, and watching an average fall is exactly the discouragement the guardrails
 * exist to prevent. Books-per-month counts distinct titles (the ladder's rule);
 * pages-per-month counts every finished reading (pages are facts).
 */
export function monthlyPace(
	readings: readonly Reading[],
	books: readonly Book[],
	readerId: string,
	nowMs: number
): { booksPerMonth: number; pagesPerMonth: number } | null {
	const finishes = readings
		.filter((r) => r.readerId === readerId && r.finishedAt)
		.map((r) => Date.parse(r.finishedAt!))
		.filter((t) => !Number.isNaN(t));
	if (finishes.length === 0) return null;

	const spanDays = (nowMs - Math.min(...finishes)) / (24 * 60 * 60 * 1000);
	if (spanDays < MIN_PACE_DAYS) return null;

	const months = spanDays / AVERAGE_MONTH_DAYS;
	return {
		booksPerMonth: finishedBookCount(readings, readerId) / months,
		pagesPerMonth: pagesRead(readings, books, readerId) / months
	};
}

/**
 * How much of the current shelf this reader has finished, in whole percent.
 *
 * Counted against the books actually on the shelf now — a finished book that was later
 * deleted or archived neither helps nor hurts, so the figure always answers the
 * question a person standing in front of the shelf would ask. `null` with no books,
 * because 0% of nothing is not a fact worth a card.
 */
export function shelfReadPercent(
	readings: readonly Reading[],
	books: readonly Book[],
	readerId: string | null
): number | null {
	if (books.length === 0) return null;
	const finished = new Set<string>();
	for (const r of readings) {
		if (r.finishedAt && (readerId === null || r.readerId === readerId)) finished.add(r.bookId);
	}
	const onShelf = books.filter((b) => finished.has(b.id)).length;
	return Math.round((onShelf / books.length) * 100);
}

/** Distinct books this reader finished during `year`. The number a school year asks about. */
export function finishedInYear(
	readings: readonly Reading[],
	readerId: string,
	year: number
): number {
	const finished = new Set<string>();
	for (const r of readings) {
		if (r.readerId === readerId && r.finishedAt?.startsWith(String(year))) {
			finished.add(r.bookId);
		}
	}
	return finished.size;
}

/**
 * The longest book this reader has finished, by page count. Null until a finished book
 * has a page count at all; books without one cannot win, only not compete.
 */
export function longestFinished(
	readings: readonly Reading[],
	books: readonly Book[],
	readerId: string
): { title: string; pageCount: number } | null {
	const finished = new Set<string>();
	for (const r of readings) {
		if (r.readerId === readerId && r.finishedAt) finished.add(r.bookId);
	}
	let best: { title: string; pageCount: number } | null = null;
	for (const book of books) {
		if (!finished.has(book.id) || !book.pageCount) continue;
		if (!best || book.pageCount > best.pageCount) {
			best = { title: book.title, pageCount: book.pageCount };
		}
	}
	return best;
}
