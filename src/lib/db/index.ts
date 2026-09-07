/**
 * Local persistence.
 *
 * IndexedDB via Dexie, chosen for versioned migrations: the schema will change and hand-rolling `onupgradeneeded` chains across releases on devices that skip versions is a real source of data-loss bugs.
 *
 * The only network activity in the whole app is initiated from here: draining the pending-lookup queue and fetching covers, both through src/lib/lookup.ts, and both switchable off in Setup. Everything else the app knows lives on the device.
 *
 * ## Badges are append-only
 *
 * `settleBadges` only ever inserts. There is deliberately no code path that deletes or updates an EarnedBadge row: once earned, a badge is permanent even if the data that earned it is later corrected (guardrail #3 in PLAN.md). The label and emoji are snapshotted at earn time so a later rewording cannot rewrite history.
 */

import { browser } from '$app/environment';
import Dexie, { liveQuery, type Table } from 'dexie';
import { readable, type Readable } from 'svelte/store';
import type {
	Book,
	Collection,
	BookMetadata,
	EarnedBadge,
	PendingLookup,
	Reader,
	Reading,
	Settings,
	ShelfState
} from '$lib/domain/types';
import { newlyEarnedBadges, type BadgeId } from '$lib/domain/badges';
import { shouldRetryLookup } from '$lib/domain/retry';
import { buildExport, parseImport, type BackupFile } from '$lib/domain/transfer';
import { fetchBookMetadata } from '$lib/lookup';

/** Settings is a singleton row; Dexie needs a key for it. */
export interface SettingsRow extends Settings {
	id: 'singleton';
}

/** A cover image, stored as a blob so the shelf renders offline. */
export interface CoverRow {
	id: string;
	blob: Blob;
}

class CorujaDb extends Dexie {
	readers!: Table<Reader, string>;
	books!: Table<Book, string>;
	readings!: Table<Reading, string>;
	collections!: Table<Collection, string>;
	earnedBadges!: Table<EarnedBadge, string>;
	pendingLookups!: Table<PendingLookup, string>;
	covers!: Table<CoverRow, string>;
	settings!: Table<SettingsRow, string>;

	constructor() {
		super('coruja');

		// v1. Add a new version block for changes; never edit this one in place.
		this.version(1).stores({
			readers: 'id, archived',
			books: 'id, isbn13, title, archived',
			readings: 'id, bookId, readerId, finishedAt',
			earnedBadges: 'id, readerId, badgeId',
			pendingLookups: 'isbn13, bookId',
			covers: 'id',
			settings: 'id'
		});

		// v2: collections. Existing tables carry over untouched; the new optional
		// Book.collectionIds field needs no index because search is in-memory.
		this.version(2).stores({
			collections: 'id'
		});
	}
}

export const db = new CorujaDb();

export function uid(): string {
	return crypto.randomUUID();
}

const now = (): string => new Date().toISOString();

// ---------------------------------------------------------------------------
// Settings

export const DEFAULT_SETTINGS: SettingsRow = {
	id: 'singleton',
	lookupEnabled: true
	// `locale` is deliberately absent: it holds an explicit override chosen in Setup, and a default here would mean the browser's language was never consulted.
};

export async function getSettings(): Promise<SettingsRow> {
	return (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<SettingsRow>): Promise<void> {
	const current = await getSettings();
	await db.settings.put({ ...current, ...patch, id: 'singleton' });
}

// ---------------------------------------------------------------------------
// Live stores
//
// Dexie's liveQuery re-runs whenever a transaction touches the tables it read, and the readable wrapper makes that a Svelte store. Inert outside the browser so prerendering cannot touch IndexedDB: on the server every store holds `undefined` forever, which is exactly the "loading" state each screen already renders.

function live<T>(query: () => Promise<T>): Readable<T | undefined> {
	if (!browser) return readable<T | undefined>(undefined);
	return readable<T | undefined>(undefined, (set) => {
		const subscription = liveQuery(query).subscribe({
			next: (value) => set(value),
			error: (error) => console.error('[coruja] live query failed', error)
		});
		return () => subscription.unsubscribe();
	});
}

export const settingsStore = live(getSettings);
export const readersStore = live(() => db.readers.toArray());
export const booksStore = live(() => db.books.toArray());
export const readingsStore = live(() => db.readings.toArray());
export const collectionsStore = live(() => db.collections.toArray());
export const earnedBadgesStore = live(() => db.earnedBadges.toArray());
export const pendingLookupsStore = live(() => db.pendingLookups.toArray());

/** Everything the domain functions operate on, for imperative code paths. */
export async function loadState(): Promise<ShelfState & { pendingLookups: PendingLookup[] }> {
	const [settings, readers, books, readings, collections, earnedBadges, pendingLookups] =
		await Promise.all([
			getSettings(),
			db.readers.toArray(),
			db.books.toArray(),
			db.readings.toArray(),
			db.collections.toArray(),
			db.earnedBadges.toArray(),
			db.pendingLookups.toArray()
		]);
	return { settings, readers, books, readings, collections, earnedBadges, pendingLookups };
}

// ---------------------------------------------------------------------------
// Readers

export async function addReader(
	name: string,
	emoji: string,
	colour: string,
	adult = false
): Promise<Reader> {
	const reader: Reader = { id: uid(), name: name.trim(), emoji, colour, createdAt: now() };
	if (adult) reader.adult = true;
	await db.readers.add(reader);
	// The first reader becomes the active one without a separate step.
	const settings = await getSettings();
	if (!settings.activeReaderId) await saveSettings({ activeReaderId: reader.id });
	return reader;
}

/** Rename a reader or change their avatar. History keeps its author either way: readings reference the reader's id, which never changes. */
export async function editReader(
	id: string,
	patch: Partial<Pick<Reader, 'name' | 'emoji' | 'colour' | 'adult'>>
): Promise<void> {
	await db.readers.update(id, patch);
}

export async function archiveReader(id: string): Promise<void> {
	await db.readers.update(id, { archived: true });
	const settings = await getSettings();
	if (settings.activeReaderId === id) {
		const next = (await db.readers.toArray()).find((r) => !r.archived);
		await saveSettings({ activeReaderId: next?.id });
	}
}

// ---------------------------------------------------------------------------
// Books

/** One book by id. Exists so no component ever needs the raw Dexie handle. */
export async function getBook(id: string): Promise<Book | undefined> {
	return db.books.get(id);
}

export async function findBookByIsbn(isbn13: string): Promise<Book | undefined> {
	return db.books.where('isbn13').equals(isbn13).first();
}

/**
 * Create the book row immediately — enrichment is asynchronous and optional, so adding a book never waits on the network (see PLAN.md, "Lookup never blocks").
 */
export async function addBook(
	fields: Partial<Book> & { title: string; source: Book['source'] }
): Promise<Book> {
	const book: Book = { id: uid(), authors: [], addedAt: now(), ...fields };
	await db.books.add(book);
	return book;
}

/** A human edit: applies the patch and sets `editedByHand`, which blocks re-enrichment. */
export async function editBook(id: string, patch: Partial<Book>): Promise<void> {
	await db.books.update(id, { ...patch, editedByHand: true });
}

/**
 * Delete a book outright, with everything that hangs off it: its readings, its cover blob, its queued lookup. For the book added by mistake — a wrong scan, a duplicate.
 *
 * Deliberately NOT archive: readers are archived because history keeps its author, but a mistaken book is not history, it is noise. The one thing that survives is any badge it helped earn — badges are never revoked (guardrail #3), and the ladder, being derived, simply recomputes: a reader who deletes a finished book shows the lower rung again without ceremony.
 */
export async function deleteBook(id: string): Promise<void> {
	const book = await db.books.get(id);
	if (!book) return;
	await db.transaction('rw', [db.books, db.readings, db.covers, db.pendingLookups], async () => {
		await db.readings.where('bookId').equals(id).delete();
		if (book.coverId) await db.covers.delete(book.coverId);
		if (book.isbn13) await db.pendingLookups.where('bookId').equals(id).delete();
		await db.books.delete(id);
	});
}

// ---------------------------------------------------------------------------
// Readings and badges

export async function startReading(bookId: string, readerId: string): Promise<Reading> {
	const reading: Reading = { id: uid(), bookId, readerId, startedAt: now() };
	await db.readings.add(reading);
	return reading;
}

/**
 * Finish the open reading (or record a whole start-to-finish if none is open), then settle badges. Returns the badges earned by this finish, for the celebration.
 */
export async function finishReading(
	bookId: string,
	readerId: string,
	badgeSnapshot: (badgeId: BadgeId) => { label: string }
): Promise<EarnedBadge[]> {
	const open = await db.readings
		.where('bookId')
		.equals(bookId)
		.filter((r) => r.readerId === readerId && !r.finishedAt)
		.first();

	if (open) {
		await db.readings.update(open.id, { finishedAt: now() });
	} else {
		await db.readings.add({ id: uid(), bookId, readerId, startedAt: now(), finishedAt: now() });
	}

	return settleBadges(readerId, badgeSnapshot);
}

/**
 * Record a book read before the app existed: one reading whose start and finish both
 * carry the given day. The date matters beyond ceremony: "finished in 2024" belongs in
 * 2024's count, not in the year the family happened to catalogue its shelf. Badges
 * settle normally, because the reading really happened.
 */
export async function recordPastRead(
	bookId: string,
	readerId: string,
	finishedOn: string, // YYYY-MM-DD from a date input
	badgeSnapshot: (badgeId: BadgeId) => { label: string }
): Promise<EarnedBadge[]> {
	// Midday UTC, so the calendar day survives every timezone's rendering of it.
	const stamp = `${finishedOn}T12:00:00.000Z`;
	await db.readings.add({ id: uid(), bookId, readerId, startedAt: stamp, finishedAt: stamp });
	return settleBadges(readerId, badgeSnapshot);
}

/**
 * Undo this reader's latest reading of a book — the "marked as finished by mistake" escape hatch, which previously required deleting the whole book and re-scanning it.
 *
 * Deletes the most recent reading row rather than clearing its `finishedAt`: the row itself is the mistake, and removing it restores whatever came before — an earlier genuine finish stays finished, a first-time mistake returns the book to the shelf. Badges already earned stay earned (guardrail #3); the ladder, derived, recounts.
 */
export async function undoLatestReading(bookId: string, readerId: string): Promise<void> {
	const rows = await db.readings
		.where('bookId')
		.equals(bookId)
		.filter((r) => r.readerId === readerId)
		.toArray();
	if (rows.length === 0) return;
	const latest = rows.toSorted((a, b) =>
		(b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt)
	)[0];
	await db.readings.delete(latest.id);
}

// ---------------------------------------------------------------------------
// Collections

/** A family-defined grouping; the emoji is its whole visual identity. */
export async function addCollection(name: string, emoji: string): Promise<Collection> {
	const collection: Collection = {
		id: uid(),
		name: name.trim(),
		emoji: emoji.trim(),
		createdAt: now()
	};
	await db.collections.add(collection);
	return collection;
}

/** Rename or re-badge a collection; membership is untouched. */
export async function editCollection(
	collectionId: string,
	patch: Partial<Pick<Collection, 'name' | 'emoji'>>
): Promise<void> {
	await db.collections.update(collectionId, patch);
}

/**
 * Delete a collection and unthread it from every book, in one transaction: a dangling
 * collectionId is invisible in the UI but would still round-trip through backups forever.
 */
export async function deleteCollection(collectionId: string): Promise<void> {
	await db.transaction('rw', [db.collections, db.books], async () => {
		await db.collections.delete(collectionId);
		const books = await db.books.toArray();
		for (const book of books) {
			if (book.collectionIds?.includes(collectionId)) {
				const remaining = book.collectionIds.filter((id) => id !== collectionId);
				await db.books.update(book.id, {
					collectionIds: remaining.length > 0 ? remaining : undefined
				});
			}
		}
	});
}

/**
 * Award any badges newly earned by `readerId`. Insert-only — see the module header.
 */
export async function settleBadges(
	readerId: string,
	snapshot: (badgeId: BadgeId) => { label: string }
): Promise<EarnedBadge[]> {
	const [books, readings, held] = await Promise.all([
		db.books.toArray(),
		db.readings.toArray(),
		db.earnedBadges.where('readerId').equals(readerId).toArray()
	]);

	const earned = newlyEarnedBadges(
		{ books, readings },
		readerId,
		held.map((b) => b.badgeId)
	);

	const rows: EarnedBadge[] = earned.map((definition) => ({
		id: uid(),
		badgeId: definition.id,
		readerId,
		earnedAt: now(),
		label: snapshot(definition.id).label,
		emoji: definition.emoji
	}));

	if (rows.length > 0) await db.earnedBadges.bulkAdd(rows);
	return rows;
}

// ---------------------------------------------------------------------------
// Enrichment: apply lookup results, fetch covers, drain the offline queue

/**
 * Apply provider metadata to a book — unless a human got there first. `editedByHand` wins over any API for every text field, always. The cover is the one exception: it is not something a person typed, so a hand-edited book with no cover still gets one.
 */
export async function applyMetadata(bookId: string, metadata: BookMetadata): Promise<void> {
	const book = await db.books.get(bookId);
	if (!book) return;

	const patch: Partial<Book> = {};

	if (!book.editedByHand) {
		patch.enrichedAt = now();
		if (metadata.title) patch.title = metadata.title;
		if (metadata.authors?.length) patch.authors = metadata.authors;
		if (metadata.publisher) patch.publisher = metadata.publisher;
		if (metadata.olKey) patch.olKey = metadata.olKey;
		if (metadata.pageCount) patch.pageCount = metadata.pageCount;
		if (metadata.language) patch.language = metadata.language;
		if (metadata.publishedYear) patch.publishedYear = metadata.publishedYear;
	}

	if (metadata.coverUrl && !book.coverId) {
		const coverId = await fetchCover(metadata.coverUrl);
		if (coverId) patch.coverId = coverId;
	}

	if (Object.keys(patch).length > 0) await db.books.update(bookId, patch);
}

/** Fetch a cover to a blob so the shelf renders offline. Null on any failure. */
async function fetchCover(url: string): Promise<string | null> {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
		if (!response.ok) return null;
		const blob = await response.blob();
		if (blob.size === 0 || !blob.type.startsWith('image/')) return null;
		const id = uid();
		await db.covers.add({ id, blob });
		return id;
	} catch {
		return null;
	}
}

/**
 * Look a book up now, or queue it for later. Called after addBook when scanning. Never throws: a failed lookup is a pending lookup, not an error.
 */
export async function enrichBook(bookId: string, isbn13: string): Promise<'done' | 'queued'> {
	const settings = await getSettings();
	if (settings.lookupEnabled === false) return 'done';

	const metadata = navigator.onLine ? await fetchBookMetadata(isbn13) : null;
	if (metadata) {
		await applyMetadata(bookId, metadata);
		await db.pendingLookups.delete(isbn13);
		return 'done';
	}

	await db.pendingLookups.put({ isbn13, bookId, queuedAt: now(), attempts: 1, lastTriedAt: now() });
	return 'queued';
}

/**
 * Drain the queue. Called on app start and when connectivity returns.
 *
 * Each entry is gated by the backoff policy in domain/retry.ts — without it, a book neither provider knows was retried on every app start forever, and Google answered the repetition with 429s that rate-limited the whole device.
 */
export async function drainPendingLookups(): Promise<void> {
	const settings = await getSettings();
	if (settings.lookupEnabled === false) return;

	for (const pending of await db.pendingLookups.toArray()) {
		if (!shouldRetryLookup(pending, Date.now())) continue;

		const metadata = await fetchBookMetadata(pending.isbn13);
		if (metadata) {
			await applyMetadata(pending.bookId, metadata);
			await db.pendingLookups.delete(pending.isbn13);
		} else {
			await db.pendingLookups.update(pending.isbn13, {
				attempts: pending.attempts + 1,
				lastTriedAt: now()
			});
		}
	}
}

/** Wire the queue to connectivity. Returns an unsubscribe, for onMount. */
export function watchConnectivity(): () => void {
	if (!browser) return () => {};
	const drain = () => void drainPendingLookups().catch(() => {});
	window.addEventListener('online', drain);
	// One pass on start too: the app may have been closed while offline.
	if (navigator.onLine) drain();
	return () => window.removeEventListener('online', drain);
}

// ---------------------------------------------------------------------------
// Backup

export async function exportBackup(): Promise<BackupFile> {
	return buildExport(await loadState());
}

/**
 * Replace everything with the backup's contents, atomically: one transaction, so a malformed file (which throws in parseImport, before this) or a mid-restore crash cannot leave half a shelf.
 */
export async function importBackup(json: string): Promise<void> {
	const backup = parseImport(json);
	await db.transaction(
		'rw',
		[
			db.readers,
			db.books,
			db.readings,
			db.collections,
			db.earnedBadges,
			db.pendingLookups,
			db.covers,
			db.settings
		],
		async () => {
			await Promise.all([
				db.readers.clear(),
				db.books.clear(),
				db.readings.clear(),
				db.collections.clear(),
				db.earnedBadges.clear(),
				db.pendingLookups.clear(),
				db.covers.clear(),
				db.settings.clear()
			]);
			await Promise.all([
				db.readers.bulkAdd(backup.readers),
				db.books.bulkAdd(backup.books),
				db.readings.bulkAdd(backup.readings),
				db.collections.bulkAdd(backup.collections),
				db.earnedBadges.bulkAdd(backup.earnedBadges),
				db.pendingLookups.bulkAdd(backup.pendingLookups),
				db.settings.put({ ...backup.settings, id: 'singleton' })
			]);
		}
	);
	/*
	 * Covers are not in the backup (see transfer.ts). Re-queue every book that has an ISBN so the next drain restores the covers the file could not carry. Books whose details a human typed keep those details — editedByHand still blocks field overwrites in applyMetadata — but coverless books get their covers back.
	 */
	const books = await db.books.toArray();
	const stamp = now();
	await db.pendingLookups.bulkPut(
		books
			.filter((b) => b.isbn13 && !b.coverId)
			.map((b) => ({ isbn13: b.isbn13!, bookId: b.id, queuedAt: stamp, attempts: 0 }))
	);
}
