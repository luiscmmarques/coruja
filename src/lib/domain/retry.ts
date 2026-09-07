/**
 * Retry policy for the pending-lookup queue.
 *
 * Why this exists: the first build had none, and the failure mode arrived within a day. A book genuinely unknown to both providers sat in the queue forever, was retried on every app start, and Google answered the repetition with 429 Too Many Requests — rate-limiting the whole device, including lookups for books it *does* know.
 *
 * The policy: exponential backoff between attempts, and a hard cap. A book the providers do not know after eight tries over several days is a book they do not know; its details are one hand-edit away, which even earns the Cataloguer badge's spirit if not its letter. The row stays in the queue (a future version may add a "try again" button) but is never retried automatically past the cap.
 */

import type { PendingLookup } from './types.ts';

/** After this many failed attempts, stop retrying automatically. */
export const MAX_LOOKUP_ATTEMPTS = 8;

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The wait before attempt `attempts + 1`: 30 minutes doubling per attempt, capped at a day. 30m, 1h, 2h, 4h, 8h, 16h, 24h.
 */
export function lookupCooldownMs(attempts: number): number {
	return Math.min(THIRTY_MINUTES_MS * 2 ** Math.max(0, attempts - 1), ONE_DAY_MS);
}

/**
 * Whether the queue drain should try this entry now.
 *
 * `nowMs` is a parameter rather than `Date.now()` so the policy is a pure function — testable without clocks, and the caller decides what "now" means.
 */
export function shouldRetryLookup(pending: PendingLookup, nowMs: number): boolean {
	if (pending.attempts >= MAX_LOOKUP_ATTEMPTS) return false;
	if (!pending.lastTriedAt) return true;

	const lastTried = Date.parse(pending.lastTriedAt);
	// An unparseable timestamp counts as "never tried" rather than "never retry": failing open costs one request; failing closed silently strands the book.
	if (Number.isNaN(lastTried)) return true;

	return nowMs - lastTried >= lookupCooldownMs(pending.attempts);
}
