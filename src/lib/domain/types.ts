/**
 * The data model. Everything in `src/lib/domain` depends on nothing outside this folder — no Svelte, no Dexie, no DOM — so it runs in plain node under vitest and is the regression baseline for the whole app.
 *
 * ## Shape of the model
 *
 * A `Book` is a physical object the household owns: it exists once, whoever reads it. A `Reading` is one reader's journey through one book — started, then finished. The same book read by two children is two readings; a re-read is a new reading with its own dates. A book with no readings is simply on the shelf: inventory.
 *
 * Progress is derived, never stored. A reader's ladder position is the count of their finished readings, so correcting a mistake recomputes honestly and nothing can drift.
 *
 * ## Dates
 *
 * ISO strings throughout (`YYYY-MM-DD` for days, full ISO for instants), because they survive JSON round-trips — the backup format — without a serializer.
 */

/** A person in the household. Archived rather than deleted, so history keeps its author. */
export interface Reader {
	id: string;
	name: string;
	/** One emoji, the reader's avatar. Picked at creation, changeable in Setup. */
	emoji: string;
	/** A hue for the reader's accents, one of READER_COLOURS. */
	colour: string;
	createdAt: string;
	/**
	 * Whether this reader is an adult. Absent means child — the safe default, because
	 * anything gated on it (sharing outward, a buy link) must be opted INTO for a
	 * profile, never accidentally available to a kid whose parent skipped a checkbox.
	 */
	adult?: boolean;
	archived?: boolean;
}

/** Colours a reader can pick. Each pairs with white text at AA or better. */
export const READER_COLOURS: readonly string[] = [
	'#4b3f9e', // indigo — the app's own
	'#1f6f4a', // green
	'#a34796', // magenta
	'#b3541e', // ochre
	'#2b6cb0', // blue
	'#8a5a00' // gold
];

/**
 * Avatars a reader can pick. Animals only — a deliberate menagerie rather than faces, so no child compares her avatar's skin tone to her own. The owl goes first because this is coruja. One list, shared by every screen that creates a reader, so the same choice appears everywhere.
 */
export const READER_EMOJI: readonly string[] = [
	'🦉',
	'🐣',
	'🦊',
	'🐰',
	'🐻',
	'🐱',
	'🐶',
	'🦄',
	'🐸',
	'🐢',
	'🐼',
	'🐨',
	'🦁',
	'🐯',
	'🐭',
	'🐹',
	'🐷',
	'🐮',
	'🐵',
	'🐧',
	'🦋',
	'🐝',
	'🐙',
	'🦕',
	'🐬',
	'🐳',
	'🦔',
	'🦜',
	'🐺',
	'🦩'
];

/** How a book entered the shelf. `manual` with no ISBN is a first-class book. */
export type BookSource = 'scan' | 'manual';

/** A physical book the household owns. One row per copy-worth-tracking. */
export interface Book {
	id: string;
	/**
	 * Normalised to 13 digits, no hyphens (see isbn.ts). Optional: books predating ISBNs, homemade books and gifts have none, and they are equal citizens.
	 */
	isbn13?: string;
	title: string;
	authors: string[];
	/**
	 * The publishing house, as the provider or the human wrote it. Searchable, and the hook for by-publisher statistics later ("everything we own from Gallimard").
	 */
	publisher?: string;
	pageCount?: number;
	/** BCP-47-ish language of the text, lowercased base tag: 'en', 'fr', 'pt'… */
	language?: string;
	publishedYear?: number;
	/** Key into the covers table; absent until a cover has been fetched or added. */
	coverId?: string;
	/** Open Library edition key, e.g. `'/books/OL8840824M'`. Kept for a future
	 * "refresh this book" feature: it names the exact edition record this book came from, so a refresh needs no ISBN search and cannot land on a different edition. */
	olKey?: string;
	/**
	 * What the book cost, in the household's own currency, which is never asked and
	 * never displayed with a symbol: a family knows its own money. A number so a
	 * future "what the shelf is worth" stat can sum it.
	 */
	purchasePrice?: number;
	/** Where the book physically lives, in the family's own words: "salon, top shelf". */
	shelfLocation?: string;
	/** Collections this book belongs to; a book may live in several. */
	collectionIds?: string[];
	addedAt: string;
	source: BookSource;
	/**
	 * Set the moment a human edits any metadata field. Blocks re-enrichment: once a person has corrected a title or a page count, no API may overwrite it.
	 */
	editedByHand?: boolean;
	/** Set when a lookup provider filled this book in. Absent means never enriched. */
	enrichedAt?: string;
	/**
	 * An adult's book: hidden entirely from non-adult profiles — absence, not a warning label a child would find interesting. Only adult profiles see the checkbox that sets it, so a child can neither discover nor un-hide one.
	 */
	adult?: boolean;
	archived?: boolean;
}

/**
 * One reader's journey through one book. Status is implicit in the dates: no `finishedAt` means currently reading; with it, finished.
 */
/**
 * A family-defined grouping: "Dinosaurs", "School books", "Bedtime". The emoji is the
 * whole visual language, chosen freely by the family (any emoji the OS can type), so
 * a shelf full of collections reads at a glance without a colour system.
 */
export interface Collection {
	id: string;
	name: string;
	emoji: string;
	createdAt: string;
}

/**
 * The collection picker's palette: twenty feelings a book can leave you with, not
 * twenty things a book can be about. The readers' picker owns the animals; keeping
 * the two vocabularies apart means a shelf never confuses "who" with "how it felt".
 */
export const COLLECTION_EMOJI = [
	'😂', // laughed out loud
	'😍', // fell in love
	'😱', // deliciously scared
	'🤯', // mind blown
	'😭', // made me cry
	'😅', // phew, close one
	'🤔', // made me think
	'🧐', // solved a mystery
	'🤗', // warm and cosy
	'😴', // bedtime calm
	'🤣', // silly fun
	'🤓', // learned something
	'🤩', // pure wonder
	'😮', // did not see that coming
	'😇', // sweet and kind
	'🤠', // adventure!
	'🥸', // secrets and spies
	'🥳', // celebration
	'🤭', // giggles
	'😌' // comfort reread
] as const;

export interface Reading {
	id: string;
	bookId: string;
	readerId: string;
	startedAt: string;
	finishedAt?: string;
}

/** The status of a book for a given reader, derived from their readings. */
export type BookStatus = 'shelf' | 'reading' | 'finished';

/**
 * A badge earned by a reader. The label and emoji are snapshotted at earn time, so renaming a badge in a later version cannot rewrite a child's history. Never deleted, never revoked — see the guardrails in PLAN.md.
 */
export interface EarnedBadge {
	id: string;
	/** Which badge, keyed into the catalogue in badges.ts. */
	badgeId: string;
	readerId: string;
	earnedAt: string;
	/** The badge's label in the locale in force when it was earned. */
	label: string;
	emoji: string;
}

/** An ISBN the lookup could not resolve yet, waiting for connectivity. */
export interface PendingLookup {
	/** The normalised ISBN-13; also the primary key, so a book queues at most once. */
	isbn13: string;
	bookId: string;
	queuedAt: string;
	attempts: number;
	/** When the last attempt ran; drives the backoff in retry.ts. Absent = never tried. */
	lastTriedAt?: string;
}

/** Metadata a lookup provider returned. The shape the provider normalises into. */
export interface BookMetadata {
	title?: string;
	authors?: string[];
	publisher?: string;
	pageCount?: number;
	language?: string;
	publishedYear?: number;
	/** URL of a cover image, if the provider offers one. */
	coverUrl?: string;
	/** Open Library edition key, for a future refresh feature. */
	olKey?: string;
}

export interface Settings {
	/** Explicit language override chosen in Setup; absent means follow the browser. */
	locale?: 'en' | 'fr' | 'de' | 'it' | 'pt';
	/** The reader currently using the app. */
	activeReaderId?: string;
	/**
	 * Whether scanning may call the lookup providers. On by default; the ISBN request is the only network egress in the app, and this is the off switch.
	 */
	lookupEnabled?: boolean;
	/**
	 * Whether a lookup may also ask Google Books when Open Library falls short. Off by default and meaningful only when a build carries an API key: Open Library is a non-profit and the privacy page leans on that, so sending the ISBN to Google is a separate, explicit opt-in rather than part of `lookupEnabled`.
	 */
	googleBooksEnabled?: boolean;
	/**
	 * Salted SHA-256 of the family PIN (see domain/pin.ts). When set, switching the active reader to an adult profile asks for the PIN — the lock that makes hiding adult books mean something, since the switcher is otherwise one tap.
	 */
	adultPinHash?: string;
}

/** Everything the domain functions operate on, loaded in one shot from the database. */
export interface ShelfState {
	readers: Reader[];
	books: Book[];
	readings: Reading[];
	collections: Collection[];
	earnedBadges: EarnedBadge[];
	settings: Settings;
}

/** The status of `book` for `reader`, derived from the readings. */
export function bookStatus(
	readings: readonly Reading[],
	bookId: string,
	readerId: string
): BookStatus {
	let status: BookStatus = 'shelf';
	for (const r of readings) {
		if (r.bookId !== bookId || r.readerId !== readerId) continue;
		if (r.finishedAt) return 'finished';
		status = 'reading';
	}
	return status;
}

/** Count of distinct books `reader` has finished. A re-read counts once. */
export function finishedBookCount(readings: readonly Reading[], readerId: string): number {
	const finished = new Set<string>();
	for (const r of readings) {
		if (r.readerId === readerId && r.finishedAt) finished.add(r.bookId);
	}
	return finished.size;
}
