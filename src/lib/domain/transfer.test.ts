/**
 * Transfer round-trip discipline, copied from Graftful.
 *
 * The fixtures below are typed `Required<Reader>`, `Required<Book>`, `Required<Reading>` and so on — *every* field, optional ones included, must be present. That is the whole mechanism: add a field to `Book` in types.ts and this file stops compiling, because the object literal is now missing a required property. Rename one and it stops compiling, because the old key becomes an excess property. Remove one and the same.
 *
 * So the moment the model changes, someone is forced to come here, decide whether the new field belongs in the backup, and either put it in the fixture — proving it survives a round-trip — or leave it out deliberately, with a comment saying why (covers are the standing example; see the header of transfer.ts). A test that fails to *compile* on a model change is the only kind of test that cannot be forgotten, and it is what keeps backups honest as the app grows.
 *
 * Do not "fix" a compile error here by loosening the types. Fix it by updating the fixture.
 */

import { describe, expect, it } from 'vitest';
import type {
	Book,
	Collection,
	EarnedBadge,
	PendingLookup,
	Reader,
	Reading,
	Settings
} from './types.ts';
import { buildExport, parseImport, type BackupFile } from './transfer.ts';

// Every field of every record, deliberately. See the note above.
const reader: Required<Reader> = {
	id: 'reader-1',
	name: 'Inês',
	emoji: '🦊',
	colour: '#4b3f9e',
	createdAt: '2026-01-01T09:00:00.000Z',
	adult: true,
	archived: false
};

const book: Required<Book> = {
	id: 'book-1',
	isbn13: '9780141187761',
	title: 'Wuthering Heights',
	authors: ['Emily Brontë'],
	publisher: 'Penguin Classics',
	pageCount: 416,
	language: 'en',
	publishedYear: 1847,
	coverId: 'cover-1',
	olKey: '/books/OL38470310M',
	purchasePrice: 12.5,
	shelfLocation: 'salon, top shelf',
	collectionIds: ['col-1'],
	addedAt: '2026-01-02T10:00:00.000Z',
	source: 'scan',
	editedByHand: true,
	enrichedAt: '2026-01-02T10:00:01.000Z',
	adult: false,
	archived: false
};

const collection: Required<Collection> = {
	id: 'col-1',
	name: 'Dinosaurs',
	emoji: '🦕',
	createdAt: '2026-01-02T00:00:00.000Z'
};

const reading: Required<Reading> = {
	id: 'reading-1',
	bookId: 'book-1',
	readerId: 'reader-1',
	startedAt: '2026-01-03',
	finishedAt: '2026-02-14'
};

const earnedBadge: Required<EarnedBadge> = {
	id: 'earned-1',
	badgeId: 'doorstop',
	readerId: 'reader-1',
	earnedAt: '2026-02-14T20:00:00.000Z',
	label: 'Doorstop',
	emoji: '🧱'
};

const pendingLookup: Required<PendingLookup> = {
	isbn13: '9780306406157',
	bookId: 'book-2',
	queuedAt: '2026-02-15T08:00:00.000Z',
	lastTriedAt: '2026-02-15T09:00:00.000Z',
	attempts: 3
};

const settings: Required<Settings> = {
	locale: 'fr',
	activeReaderId: 'reader-1',
	lookupEnabled: true,
	googleBooksEnabled: true,
	adultPinHash: 'c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00'
};

function populatedState() {
	return {
		readers: [reader],
		books: [book],
		readings: [reading],
		collections: [collection],
		earnedBadges: [earnedBadge],
		pendingLookups: [pendingLookup],
		settings
	};
}

describe('buildExport', () => {
	it('stamps the envelope', () => {
		const backup = buildExport(populatedState());
		expect(backup.app).toBe('coruja');
		expect(backup.version).toBe(1);
		expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
	});

	it('carries every table', () => {
		const backup = buildExport(populatedState());
		expect(backup.readers).toEqual([reader]);
		expect(backup.books).toEqual([book]);
		expect(backup.readings).toEqual([reading]);
		expect(backup.earnedBadges).toEqual([earnedBadge]);
		expect(backup.pendingLookups).toEqual([pendingLookup]);
		expect(backup.settings).toEqual(settings);
	});

	it('does not carry cover image data — covers are re-fetchable, see transfer.ts', () => {
		const backup = buildExport(populatedState()) as unknown as Record<string, unknown>;
		expect(backup.covers).toBeUndefined();
		// The reference survives so the image can be matched up again after a restore.
		expect(JSON.stringify(backup)).toContain('cover-1');
	});

	it('works on an empty shelf', () => {
		const backup = buildExport({
			readers: [],
			books: [],
			readings: [],
			collections: [],
			earnedBadges: [],
			pendingLookups: [],
			settings: {}
		});
		expect(parseImport(JSON.stringify(backup))).toEqual(backup);
	});
});

describe('round trip', () => {
	it('survives JSON.stringify and parseImport intact, field for field', () => {
		const backup = buildExport(populatedState());
		const restored = parseImport(JSON.stringify(backup));
		expect(restored).toEqual(backup);
	});

	it('restores each record identically, including every optional field', () => {
		const restored = parseImport(JSON.stringify(buildExport(populatedState())));
		expect(restored.readers[0]).toEqual(reader);
		expect(restored.books[0]).toEqual(book);
		expect(restored.readings[0]).toEqual(reading);
		expect(restored.earnedBadges[0]).toEqual(earnedBadge);
		expect(restored.pendingLookups[0]).toEqual(pendingLookup);
		expect(restored.settings).toEqual(settings);
	});

	it('keeps non-ASCII names and accented titles', () => {
		const restored = parseImport(JSON.stringify(buildExport(populatedState())));
		expect(restored.readers[0]?.name).toBe('Inês');
		expect(restored.books[0]?.authors).toEqual(['Emily Brontë']);
		expect(restored.readers[0]?.emoji).toBe('🦊');
	});

	it('is stable across two passes', () => {
		const once = parseImport(JSON.stringify(buildExport(populatedState())));
		const twice = parseImport(JSON.stringify(once));
		expect(twice).toEqual(once);
	});

	/*
	 * The upgrade contract, pinned as tests. The backup file is the bridge between
	 * versions of this app: every release must read the files of every release
	 * before it, and must not destroy what a release after it wrote.
	 */
	it('upgrade contract: a file without a collections table imports with an empty one', () => {
		// Every backup exported before collections existed looks like this.
		const legacy = JSON.parse(JSON.stringify(buildExport(populatedState()))) as Record<
			string,
			unknown
		>;
		delete legacy.collections;
		const restored = parseImport(JSON.stringify(legacy));
		expect(restored.collections).toEqual([]);
		expect(restored.books).toEqual([book]);
	});

	it('upgrade contract: unknown fields on records survive the round-trip untouched', () => {
		// A file written by a NEWER build of the same version: its extra field must
		// not make the file unrestorable, and must not be stripped on the way in.
		const file = JSON.parse(JSON.stringify(buildExport(populatedState()))) as {
			books: Record<string, unknown>[];
		};
		file.books[0].favouriteQuote = 'On ne voit bien qu\u2019avec le c\u0153ur.';
		const restored = parseImport(JSON.stringify(file));
		expect((restored.books[0] as unknown as Record<string, unknown>).favouriteQuote).toBe(
			'On ne voit bien qu\u2019avec le c\u0153ur.'
		);
	});

	it('upgrade contract: unknown top-level keys are dropped, not carried', () => {
		// The envelope's shape is this module's business; a stray key must not ride
		// through into what callers persist.
		const file = JSON.parse(JSON.stringify(buildExport(populatedState()))) as Record<
			string,
			unknown
		>;
		file.telemetry = { evil: true };
		const restored = parseImport(JSON.stringify(file)) as unknown as Record<string, unknown>;
		expect('telemetry' in restored).toBe(false);
	});
});

/** A valid backup, as a plain object, for mutating into invalid ones. */
function validBackupObject(): Record<string, unknown> {
	return JSON.parse(JSON.stringify(buildExport(populatedState()))) as Record<string, unknown>;
}

describe('parseImport rejections', () => {
	it('rejects invalid JSON with not-json', () => {
		expect(() => parseImport('this is not json')).toThrow('not-json');
		expect(() => parseImport('')).toThrow('not-json');
		expect(() => parseImport('{ "app": ')).toThrow('not-json');
	});

	it('rejects another app with wrong-app', () => {
		expect(() => parseImport(JSON.stringify({ app: 'other' }))).toThrow('wrong-app');
		expect(() => parseImport(JSON.stringify({ app: 'other', version: 1 }))).toThrow('wrong-app');
		expect(() => parseImport(JSON.stringify({ version: 1 }))).toThrow('wrong-app');
	});

	it('rejects a future version with unsupported-version', () => {
		expect(() => parseImport(JSON.stringify({ app: 'coruja', version: 2 }))).toThrow(
			'unsupported-version'
		);
		expect(() => parseImport(JSON.stringify({ ...validBackupObject(), version: 2 }))).toThrow(
			'unsupported-version'
		);
		expect(() => parseImport(JSON.stringify({ app: 'coruja', version: '1' }))).toThrow(
			'unsupported-version'
		);
	});

	it('rejects a reading missing readerId with malformed', () => {
		const backup = validBackupObject();
		const readings = backup.readings as Record<string, unknown>[];
		delete readings[0]?.readerId;
		expect(() => parseImport(JSON.stringify(backup))).toThrow('malformed');
	});

	it('rejects a JSON scalar or array at the top level with malformed', () => {
		expect(() => parseImport('null')).toThrow('malformed');
		expect(() => parseImport('42')).toThrow('malformed');
		expect(() => parseImport('[]')).toThrow('malformed');
	});

	it('rejects a missing table with malformed', () => {
		for (const table of ['readers', 'books', 'readings', 'earnedBadges', 'pendingLookups']) {
			const backup = validBackupObject();
			delete backup[table];
			expect(() => parseImport(JSON.stringify(backup)), table).toThrow('malformed');
		}
	});

	it('rejects a table that is not an array with malformed', () => {
		const backup = { ...validBackupObject(), books: { id: 'book-1' } };
		expect(() => parseImport(JSON.stringify(backup))).toThrow('malformed');
	});

	it('rejects a non-object element with malformed', () => {
		const backup = { ...validBackupObject(), readers: ['reader-1'] };
		expect(() => parseImport(JSON.stringify(backup))).toThrow('malformed');
	});

	it('rejects wrong field types rather than coercing them', () => {
		const withBadPageCount = validBackupObject();
		(withBadPageCount.books as Record<string, unknown>[])[0]!.pageCount = '416';
		expect(() => parseImport(JSON.stringify(withBadPageCount))).toThrow('malformed');

		// The three youngest fields, added after the format shipped: each must be
		// validated on the way back in, not just carried on the way out.
		const withBadPublisher = validBackupObject();
		(withBadPublisher.books as Record<string, unknown>[])[0]!.publisher = ['Gallimard'];
		expect(() => parseImport(JSON.stringify(withBadPublisher))).toThrow('malformed');

		const withBadOlKey = validBackupObject();
		(withBadOlKey.books as Record<string, unknown>[])[0]!.olKey = 42;
		expect(() => parseImport(JSON.stringify(withBadOlKey))).toThrow('malformed');

		const withBadLastTried = validBackupObject();
		(withBadLastTried.pendingLookups as Record<string, unknown>[])[0]!.lastTriedAt = 12345;
		expect(() => parseImport(JSON.stringify(withBadLastTried))).toThrow('malformed');

		const withBadAuthors = validBackupObject();
		(withBadAuthors.books as Record<string, unknown>[])[0]!.authors = 'Emily Brontë';
		expect(() => parseImport(JSON.stringify(withBadAuthors))).toThrow('malformed');

		const withBadSource = validBackupObject();
		(withBadSource.books as Record<string, unknown>[])[0]!.source = 'import';
		expect(() => parseImport(JSON.stringify(withBadSource))).toThrow('malformed');

		const withBadAttempts = validBackupObject();
		(withBadAttempts.pendingLookups as Record<string, unknown>[])[0]!.attempts = 'three';
		expect(() => parseImport(JSON.stringify(withBadAttempts))).toThrow('malformed');
	});

	it('rejects missing or invalid settings and exportedAt with malformed', () => {
		const noSettings = validBackupObject();
		delete noSettings.settings;
		expect(() => parseImport(JSON.stringify(noSettings))).toThrow('malformed');

		// 'xx' is no language; 'pt' would have worked here once, and then Portuguese shipped.
		const badLocale = { ...validBackupObject(), settings: { locale: 'xx' } };
		expect(() => parseImport(JSON.stringify(badLocale))).toThrow('malformed');

		const noDate = validBackupObject();
		delete noDate.exportedAt;
		expect(() => parseImport(JSON.stringify(noDate))).toThrow('malformed');
	});

	it('rejects a badge missing its snapshotted label with malformed', () => {
		// The label is snapshotted for a reason (types.ts); a backup without it is not a backup we can restore without rewriting a child's history.
		const backup = validBackupObject();
		delete (backup.earnedBadges as Record<string, unknown>[])[0]?.label;
		expect(() => parseImport(JSON.stringify(backup))).toThrow('malformed');
	});
});

describe('current-schema coverage', () => {
	it('the fixtures exercise every field the model declares, with a present value', () => {
		/*
		 * Belt to the Required<T> braces: Required<> forces the keys to exist at compile
		 * time, and this asserts none of them is undefined at runtime — an undefined
		 * value in a fixture cannot distinguish "survived the round trip" from "silently
		 * dropped", which is exactly the failure this suite exists to catch.
		 */
		for (const [name, fixture] of Object.entries({
			reader,
			book,
			reading,
			earnedBadge,
			pendingLookup,
			settings
		})) {
			for (const [key, value] of Object.entries(fixture)) {
				expect(value, `${name}.${key} is undefined in the fixture`).not.toBeUndefined();
			}
		}
	});
});

describe('the envelope type', () => {
	it('narrows app and version to literals', () => {
		const backup: BackupFile = buildExport(populatedState());
		const app: 'coruja' = backup.app;
		const version: 1 = backup.version;
		expect([app, version]).toEqual(['coruja', 1]);
	});
});
