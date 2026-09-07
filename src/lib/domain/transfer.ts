/**
 * Backup export and import: one JSON file, the only copy of a family's shelf that exists outside a single browser profile.
 *
 * ## Covers are deliberately not in the backup
 *
 * The cover images live in their own table and stay there. Two reasons, in order of importance:
 *
 * 1. **A backup you cannot email yourself is not a backup.** Base64 blobs turn a file a
 *    parent can keep in their mail, on a stick, in a cloud folder — a few tens of kilobytes of readable JSON — into tens of megabytes of unreadable payload that mail providers bounce and text editors choke on. The format's value is that it is small, inspectable, and obviously not doing anything clever.
 * 2. **Covers are derived data.** A cover is re-fetchable from the ISBN, which *is* in
 *    the backup. Restoring a shelf gives you every book, every reading, every badge and every rung; the pictures fill themselves back in the next time the app is online, and until then a placeholder is a cosmetic loss, not a data loss.
 *
 * The tradeoff is real and worth naming: a hand-added book with a photographed cover and no ISBN loses that photo on restore. That is the price of a file you can actually keep, and it is the right side of the trade.
 *
 * ## Import rejects, it does not repair
 *
 * `parseImport` validates every element of every array structurally and throws on the first thing that is wrong. It never coerces, defaults, drops or "fixes" a bad record, because a half-understood backup restored on top of a real shelf is a worse outcome than a refusal the user can act on. The thrown messages are stable keys, not prose, so the UI can translate them: 'not-json', 'wrong-app', 'unsupported-version', 'malformed'.
 */

import type {
	Book,
	BookSource,
	Collection,
	EarnedBadge,
	PendingLookup,
	Reader,
	Reading,
	Settings,
	ShelfState
} from './types.ts';

/**
 * The backup file. `app` and `version` are first so that the first line of the file says what it is: someone opening this in a text editor in five years should be able to tell immediately.
 */
export interface BackupFile {
	app: 'coruja';
	version: 1;
	/** Full ISO instant, for the human reading the filename and the file. */
	exportedAt: string;
	readers: Reader[];
	books: Book[];
	readings: Reading[];
	collections: Collection[];
	earnedBadges: EarnedBadge[];
	pendingLookups: PendingLookup[];
	settings: Settings;
}

/**
 * Static assertion: every field of `ShelfState` must appear in `BackupFile`. Adding a table to the model without adding it to the backup format is a compile error here rather than a silent hole discovered on someone's restore.
 */
type StateFieldsCovered = Exclude<keyof ShelfState, keyof BackupFile> extends never ? true : never;
const _stateFieldsCovered: StateFieldsCovered = true;
void _stateFieldsCovered;

export function buildExport(state: ShelfState & { pendingLookups: PendingLookup[] }): BackupFile {
	return {
		app: 'coruja',
		version: 1,
		exportedAt: new Date().toISOString(),
		readers: state.readers,
		books: state.books,
		readings: state.readings,
		collections: state.collections,
		earnedBadges: state.earnedBadges,
		pendingLookups: state.pendingLookups,
		settings: state.settings
	};
}

/** The stable message keys `parseImport` throws. */
export type ImportError = 'not-json' | 'wrong-app' | 'unsupported-version' | 'malformed';

function fail(reason: ImportError): never {
	throw new Error(reason);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

function isOptionalString(value: unknown): boolean {
	return value === undefined || typeof value === 'string';
}

/** Finite numbers only: NaN and Infinity survive neither JSON nor arithmetic. */
function isOptionalNumber(value: unknown): boolean {
	return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isOptionalBoolean(value: unknown): boolean {
	return value === undefined || typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(isString);
}

function isBookSource(value: unknown): value is BookSource {
	return value === 'scan' || value === 'manual';
}

/** Every element of `value` must satisfy `check`, and `value` must be an array. */
function checkArray(value: unknown, check: (element: Record<string, unknown>) => boolean): void {
	if (!Array.isArray(value)) fail('malformed');
	for (const element of value) {
		if (!isRecord(element)) fail('malformed');
		if (!check(element)) fail('malformed');
	}
}

function isReaderShape(r: Record<string, unknown>): boolean {
	return (
		isString(r.id) &&
		isString(r.name) &&
		isString(r.emoji) &&
		isString(r.colour) &&
		isString(r.createdAt) &&
		isOptionalBoolean(r.adult) &&
		isOptionalBoolean(r.archived)
	);
}

function isBookShape(b: Record<string, unknown>): boolean {
	return (
		isString(b.id) &&
		isString(b.title) &&
		isStringArray(b.authors) &&
		isString(b.addedAt) &&
		isBookSource(b.source) &&
		isOptionalString(b.isbn13) &&
		isOptionalString(b.publisher) &&
		isOptionalNumber(b.pageCount) &&
		isOptionalString(b.language) &&
		isOptionalNumber(b.publishedYear) &&
		isOptionalString(b.olKey) &&
		isOptionalNumber(b.purchasePrice) &&
		isOptionalString(b.shelfLocation) &&
		(b.collectionIds === undefined || isStringArray(b.collectionIds)) &&
		isOptionalString(b.coverId) &&
		isOptionalBoolean(b.editedByHand) &&
		isOptionalString(b.enrichedAt) &&
		isOptionalBoolean(b.adult) &&
		isOptionalBoolean(b.archived)
	);
}

function isCollectionShape(c: Record<string, unknown>): boolean {
	return isString(c.id) && isString(c.name) && isString(c.emoji) && isString(c.createdAt);
}

function isReadingShape(r: Record<string, unknown>): boolean {
	return (
		isString(r.id) &&
		isString(r.bookId) &&
		isString(r.readerId) &&
		isString(r.startedAt) &&
		isOptionalString(r.finishedAt)
	);
}

function isEarnedBadgeShape(b: Record<string, unknown>): boolean {
	return (
		isString(b.id) &&
		isString(b.badgeId) &&
		isString(b.readerId) &&
		isString(b.earnedAt) &&
		isString(b.label) &&
		isString(b.emoji)
	);
}

function isPendingLookupShape(p: Record<string, unknown>): boolean {
	return (
		isString(p.isbn13) &&
		isString(p.bookId) &&
		isString(p.queuedAt) &&
		typeof p.attempts === 'number' &&
		Number.isFinite(p.attempts) &&
		(p.lastTriedAt === undefined || isString(p.lastTriedAt))
	);
}

function isSettingsShape(s: Record<string, unknown>): boolean {
	return (
		(s.locale === undefined || ['en', 'fr', 'de', 'it', 'pt'].includes(s.locale as string)) &&
		isOptionalString(s.adultPinHash) &&
		isOptionalString(s.activeReaderId) &&
		isOptionalBoolean(s.lookupEnabled)
	);
}

/**
 * Parse and validate a backup file. Throws `Error` whose message is one of `ImportError`; returns a `BackupFile` whose arrays hold the very objects from the file, so a round-trip is byte-for-byte faithful and nothing is quietly normalised.
 *
 * Unknown *top-level* keys are dropped, since the shape of the envelope is this module's business; unknown keys on records are left alone rather than treated as an error, so a file written by a slightly newer build of the same version does not become unrestorable over a field this build does not use.
 */
export function parseImport(json: string): BackupFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json) as unknown;
	} catch {
		fail('not-json');
	}

	if (!isRecord(parsed)) fail('malformed');
	if (parsed.app !== 'coruja') fail('wrong-app');
	if (parsed.version !== 1) fail('unsupported-version');
	if (!isString(parsed.exportedAt)) fail('malformed');

	checkArray(parsed.readers, isReaderShape);
	checkArray(parsed.books, isBookShape);
	checkArray(parsed.readings, isReadingShape);
	// Absent is legal: files written by pre-collections builds of this same unreleased
	// version have no such table, and refusing them would strand this week's backups.
	if (parsed.collections !== undefined) checkArray(parsed.collections, isCollectionShape);
	checkArray(parsed.earnedBadges, isEarnedBadgeShape);
	checkArray(parsed.pendingLookups, isPendingLookupShape);

	if (!isRecord(parsed.settings)) fail('malformed');
	if (!isSettingsShape(parsed.settings)) fail('malformed');

	return {
		app: 'coruja',
		version: 1,
		exportedAt: parsed.exportedAt,
		readers: parsed.readers as Reader[],
		books: parsed.books as Book[],
		readings: parsed.readings as Reading[],
		collections: (parsed.collections ?? []) as Collection[],
		earnedBadges: parsed.earnedBadges as EarnedBadge[],
		pendingLookups: parsed.pendingLookups as PendingLookup[],
		settings: parsed.settings as Settings
	};
}
