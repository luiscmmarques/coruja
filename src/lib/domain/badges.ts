/**
 * The badge catalogue.
 *
 * ## CRITICAL INVARIANT: earning only ever ADDS
 *
 * `earned()` is a predicate asked in one direction and one direction only. It is evaluated to decide whether to *write* a new `EarnedBadge`; its `false` is never a reason to remove one. Nothing in this module deletes, revokes, downgrades, expires or re-validates a stored badge, and no caller may either — not when the rule changes, not when this catalogue is rewritten, not when the data that earned it is later corrected or deleted. This is guardrail #3 in PLAN.md ("No award is ever revoked, for any reason") together with #9 ("correcting data must never cost a level or a badge").
 *
 * The reason is concrete: a child mistypes a page count as 4000, earns Doorstop, and an adult fixes it to 400 the next day. If earning were re-evaluated against stored badges, that correction would take the badge away, and the child would learn that fixing mistakes is punished. So the badge stays. `EarnedBadge` snapshots its label and emoji at earn time for the same reason (see types.ts): history is not rewritten.
 *
 * The practical consequence for callers: read the reader's already-earned ids, call `newlyEarnedBadges`, and insert what comes back. Never diff in the other direction.
 *
 * ## No display strings live here
 *
 * A badge is the coruja mark wearing an emoji. The emoji is data, because it is the same in every language; the label is not, and lives in i18n keyed by badge id. So the only human-readable string in this file is the emoji, and adding a badge here without adding its label is a missing-translation bug, not a silent English leak.
 */

import { type Book, type Reading } from './types.ts';

/** The slice of the world a badge can look at. Deliberately not the whole ShelfState. */
export interface BadgeState {
	books: readonly Book[];
	readings: readonly Reading[];
}

/**
 * Every badge id, as a union, so the i18n catalogues can be typed
 * `Record<BadgeId, string>`: adding a badge without adding its label in every
 * language then fails to compile instead of shipping a bare id on screen.
 */
export type BadgeId =
	| 'first-book'
	| 'five-books'
	| 'ten-books'
	| 'twenty-books'
	| 'cataloguer'
	| 'doorstop'
	| 'five-authors'
	| 'two-tongues'
	| 'polyglot';

export interface BadgeDefinition {
	id: BadgeId;
	emoji: string;
	/** Whether `readerId` qualifies right now. Only ever consulted to add — see above. */
	earned(
		state: { books: readonly Book[]; readings: readonly Reading[] },
		readerId: string
	): boolean;
}

/**
 * The books `readerId` has finished, each once however many times it was read. Books referenced by a reading but missing from `books` are skipped rather than faked.
 */
function finishedBooks(state: BadgeState, readerId: string): Book[] {
	const ids = new Set<string>();
	for (const r of state.readings) {
		if (r.readerId === readerId && r.finishedAt) ids.add(r.bookId);
	}
	if (ids.size === 0) return [];
	return state.books.filter((b) => ids.has(b.id));
}

/** A volume badge: `n` distinct finished books. */
function volume(id: BadgeId, emoji: string, n: number): BadgeDefinition {
	return {
		id,
		emoji,
		earned: (state, readerId) => finishedBooks(state, readerId).length >= n
	};
}

/** Authors compared case-insensitively and trimmed, so "roald dahl" is one person. */
function authorKey(author: string): string {
	return author.trim().toLowerCase();
}

/** Distinct languages among the reader's finished books, lowercased and trimmed. */
function finishedLanguages(state: BadgeState, readerId: string): number {
	const languages = new Set<string>();
	for (const book of finishedBooks(state, readerId)) {
		if (book.language === undefined) continue;
		const key = book.language.trim().toLowerCase();
		if (key) languages.add(key);
	}
	return languages.size;
}

export const BADGES: readonly BadgeDefinition[] = [
	volume('first-book', '🌱', 1),
	volume('five-books', '🖐️', 5),
	volume('ten-books', '🔟', 10),
	volume('twenty-books', '🏆', 20),
	{
		// The book the internet did not know, typed in by hand. The app's worst moment turned into the thing that earns a badge.
		id: 'cataloguer',
		emoji: '🗂️',
		earned: (state, readerId) =>
			finishedBooks(state, readerId).some((b) => b.source === 'manual' && !b.isbn13)
	},
	{
		id: 'doorstop',
		emoji: '🧱',
		earned: (state, readerId) =>
			finishedBooks(state, readerId).some((b) => b.pageCount !== undefined && b.pageCount >= 400)
	},
	{
		id: 'five-authors',
		emoji: '👥',
		earned: (state, readerId) => {
			const authors = new Set<string>();
			for (const book of finishedBooks(state, readerId)) {
				for (const author of book.authors) {
					const key = authorKey(author);
					if (key) authors.add(key);
				}
			}
			return authors.size >= 5;
		}
	},
	{
		id: 'two-tongues',
		emoji: '🗣️',
		earned: (state, readerId) => finishedLanguages(state, readerId) >= 2
	},
	{
		// Three languages is not twice as hard as two, it is a different kind of reader:
		// a household where German, Portuguese and French all live on the same shelf.
		id: 'polyglot',
		emoji: '🌍',
		earned: (state, readerId) => finishedLanguages(state, readerId) >= 3
	}
];

/**
 * Badges `readerId` qualifies for now and does not already hold. The result is what to insert and what to celebrate, in catalogue order so a burst of badges appears in a stable sequence rather than whatever order a Set happened to produce.
 *
 * `alreadyEarned` is a list of badge ids. Ids in it that are no longer in the catalogue are simply not returned — they stay earned, they are just not re-offered.
 */
export function newlyEarnedBadges(
	state: BadgeState,
	readerId: string,
	alreadyEarned: readonly string[]
): BadgeDefinition[] {
	const held = new Set(alreadyEarned);
	return BADGES.filter((badge) => !held.has(badge.id) && badge.earned(state, readerId));
}
