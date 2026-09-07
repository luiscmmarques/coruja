/**
 * The ladder: twenty rungs, one book each.
 *
 * ## Deliberately not a formula
 *
 * There is no XP, no curve, no weighting by page count, no streak multiplier, and there never will be (PLAN.md, "The ladder: twenty books, one owl getting happier"). A rung is a finished book. A child can hold the entire system in her head: *finish a book, go up one*. Anything cleverer would be a number only an adult could explain, and the moment it needs explaining it stops being a reward.
 *
 * ## Derived, and therefore honest
 *
 * The position is computed from the `Reading` rows every time it is asked for, never stored. Un-finishing a book added by mistake simply shows the lower rung again — no ceremony, no shame, and no stored counter that can drift away from the truth (guardrails #2 and #9: no decay, and correcting data must never cost a level). Badges are the opposite and permanent; see badges.ts.
 *
 * ## Past the top
 *
 * At twenty books the ladder is full and stays full, while `finished` keeps counting. The twenty-first book is not a disappointment, and the ladder does not sprout a second storey.
 */

import { finishedBookCount, type Reading } from './types.ts';

/** Rungs on the ladder. The display caps here; the count does not. */
export const LADDER_SIZE = 20;

/**
 * One emoji per rung, index 0 (not started) through index 20 (the top): twenty-one entries, no repeats, escalating in delight. The coruja mark is the constant on every rung; the emoji is the joke. The owl wakes up, gets its coffee, reads, goes exploring, and ends up among the stars.
 */
export const RUNG_EMOJI: readonly string[] = [
	'😴', // 0 — asleep
	'🥱', // 1 — one eye open
	'☕️', // 2 — coffee
	'👀', // 3 — awake
	'📖', // 4 — reading
	'🔖', // 5 — keeping a place
	'📚', // 6 — a small pile
	'🪶', // 7 — a feather earned
	'🕯️', // 8 — reading late
	'💡', // 9 — an idea
	'🔍', // 10 — looking closer
	'🗺️', // 11 — a map
	'🧭', // 12 — a bearing
	'🎈', // 13 — lift
	'🎉', // 14 — a proper fuss
	'🦉', // 15 — the owl itself
	'🌙', // 16 — night flight
	'✨', // 17 — sparkle
	'🌟', // 18 — a star
	'🌌', // 19 — the whole sky
	'🏆' // 20 — the top
];

/** Where `readerId` stands. `rung` is capped at LADDER_SIZE; `finished` is not. */
export function ladderPosition(
	readings: readonly Reading[],
	readerId: string
): { finished: number; rung: number; emoji: string; isFull: boolean } {
	const finished = finishedBookCount(readings, readerId);
	const rung = Math.min(finished, LADDER_SIZE);
	return {
		finished,
		rung,
		emoji: RUNG_EMOJI[rung] as string,
		isFull: finished >= LADDER_SIZE
	};
}
