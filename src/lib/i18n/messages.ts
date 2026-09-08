import type { BadgeId } from '$lib/domain/badges';
/**
 * UI message catalogue.
 *
 * English is the source and defines the type; French must satisfy `Messages`, so a missing or misspelled key is a compile error rather than a blank space discovered by a child. Values are plain strings or small functions — no template parser, no build step, no runtime dependency. A key lives here only once both languages have been written: both are complete at launch, and neither silently falls back to the other.
 *
 * On tone: the reader is a child of about seven, sometimes with a parent beside her. Warm and playful, and exclamation marks are welcome where she is being congratulated — finishing a book deserves one. But never guilt, never "you're behind", never a number she has failed to reach, and nothing that treats not reading as an error. The full guardrails are in PLAN.md; this file is where they are either honoured or quietly lost.
 */

export interface Messages {
	nav: {
		scan: string;
		shelf: string;
		badges: string;
		setup: string;
	};
	/** The header burger: the content pages, kept out of the bottom bar a child uses. */
	menu: {
		label: string;
		about: string;
		privacy: string;
		support: string;
	};
	common: {
		loading: string;
		save: string;
		cancel: string;
		close: string;
		edit: string;
		delete: string;
		add: string;
		search: string;
		back: string;
		none: string;
		/** "1 book" / "4 books". Plural-aware, so no screen glues a count to a noun. */
		book: (count: number) => string;
	};
	/**
	 * The home screen. There is no separate "Today": the shelf IS the app, with the reader's ladder and open books at the top of it. One screen fewer to build, translate and explain.
	 */
	shelf: {
		title: string;
		metaDescription: string;
		whoIsReading: string;
		ladderProgress: (finished: number) => string;
		ladderFull: string;
		booksFinished: (count: number) => string;
		/** "190 pages read" — a fact about reading done, never a target. */
		pagesRead: (count: number) => string;
		readingNow: string;
		/** Offered when nothing is open. An invitation, never a reproach. */
		startPrompt: string;
		empty: string;
		emptyHint: string;
		searchPlaceholder: string;
		filterAll: string;
		filterReading: string;
		filterFinished: string;
		filterShelf: string;
		/** First option of the language dropdown; doubles as its explanation. */
		allLanguages: string;
		sortLabel: string;
		/** "Recently added" — the default: a just-bought book is the likeliest tap. */
		sortRecentlyAdded: string;
		sortRecentlyRead: string;
		sortTitle: string;
		/** A search or filter that matches nothing. States a fact; blames nobody. */
		noMatches: string;
		byAuthor: (authors: string) => string;
		pages: (n: number) => string;
		statusShelf: string;
		statusReading: string;
		statusFinished: string;
		startReading: string;
		markFinished: string;
		readAgain: string;
		/** Cataloguing the past: mark a shelf book as read before the app existed. */
		readBefore: string;
		readOnLabel: string;
		/** Family-defined groupings with an emoji as their whole visual identity. */
		collectionsLabel: string;
		collectionsAll: string;
		collectionName: string;
		collectionEmoji: string;
		collectionAdd: string;
		collectionEdit: string;
		/** The edit dialog's collapsed drawer of rarely-touched fields. */
		advanced: string;
		collectionDeleteConfirm: (name: string) => string;
		unread: string;
		/** Undoing a mistaken finish. Says what recounts and what stays. */
		unreadConfirm: (title: string) => string;
		editBook: string;
		/** The adult-book checkbox in the edit dialog; visible to adult profiles only. */
		adultBook: string;
		deleteBook: string;
		/** Names what goes with it. Honest, and the last chance to keep a finished book. */
		deleteConfirm: (title: string) => string;
		/** Badge on a book entered by hand. A boast, not an apology. */
		addedByHand: string;
	};
	scan: {
		title: string;
		metaDescription: string;
		prompt: string;
		manualEntry: string;
		isbnLabel: string;
		isbnInvalid: string;
		cameraUnavailable: string;
		alreadyOnShelf: string;
		viewExisting: string;
		addAnyway: string;
		scanning: string;
		addManually: string;
		titleLabel: string;
		authorLabel: string;
		pagesLabel: string;
		publisherLabel: string;
		/** Optional. The household's own currency, no symbol asked or shown. */
		priceLabel: string;
		/** Free text: "salon, top shelf". The inventory half of the app. */
		locationLabel: string;
		languageLabel: string;
		added: (title: string) => string;
		searchingMetadata: string;
		/** Shown when the lookup could not run. Reassurance, not an error. */
		offlineQueued: string;
	};
	badges: {
		title: string;
		metaDescription: string;
		earnedTitle: string;
		lockedTitle: string;
		none: string;
		earnedOn: (date: string) => string;
		/** The stats section: a few honest numbers, never targets, never comparisons. */
		statsTitle: string;
		rereads: (count: number) => string;
		familyTitle: string;
		booksOnShelf: (count: number) => string;
		/** Label under a whole-percent figure: "of the shelf read". */
		ofShelfRead: string;
		booksAMonth: string;
		pagesAMonth: string;
		/** "finished in 2026", under the year's count. */
		finishedInYear: (year: number) => string;
		/** Label under the page count of the reader's longest finished book. */
		longestBook: string;
		/**
		 * Keyed by badge id, snapshotted into `EarnedBadge.label` at earn time — so rewording one here can never rewrite a child's history.
		 */
		labels: Record<BadgeId, string>;
		descriptions: Record<BadgeId, string>;
	};
	setup: {
		title: string;
		metaDescription: string;

		readersTitle: string;
		addReader: string;
		readerName: string;
		archiveReader: string;
		renameReader: string;
		/**
		 * The 16-or-older checkbox, the line defined in the label itself. Sixteen rather
		 * than eighteen on a deliberate judgement: the family PIN is a child lock a
		 * motivated teenager defeats anyway, so the gate exists to protect young
		 * children, and sixteen is also the upper bound of EU digital-consent ages.
		 * Attested by the parent, never computed: a birthdate would be the first real
		 * PII in an app that stores none. Gates outward features and adult books.
		 */
		adultReader: string;

		languageTitle: string;
		followBrowser: (lang: string) => string;

		lookupTitle: string;
		/** The privacy position in one honest sentence. Keep it plain and keep it true. */
		lookupExplain: string;
		lookupOn: string;
		lookupOff: string;
		/** The Google Books opt-in. Only rendered when the build carries an API key. */
		googleLookup: string;
		googleLookupExplain: string;

		backupTitle: string;
		backupExplain: string;
		/** Shown only when the browser refused persistent storage. */
		storageNotGuaranteed: string;
		exportButton: string;
		importButton: string;
		importConfirm: string;
		importError: {
			'not-json': string;
			'wrong-app': string;
			'unsupported-version': string;
			malformed: string;
		};

		pinTitle: string;
		/** Why the PIN exists, in one honest sentence: a child lock, not a vault. */
		pinExplain: string;
		pinPlaceholder: string;
		pinSet: string;
		pinChange: string;
		pinRemove: string;
		pinCurrent: string;
		pinNew: string;
		pinInvalid: string;
		pinWrong: string;
		pinPrompt: string;
		aboutVersion: (version: string) => string;
	};
	/**
	 * The content pages, one top-level section each, the way Graftful does it. Long
	 * prose keys; a sentence containing a link splits into Before / Link / After so no
	 * catalogue string carries markup. Brand names (Open Library, Cloudflare, PayPal,
	 * the mail address) stay literal in the page markup.
	 */
	about: {
		title: string;
		metaDescription: string;
		intro: string;
		introNote: string;
		nameTitle: string;
		name1: string;
		name2: string;
		name3: string;
		pronounce: string;
		costsTitle: string;
		costsBefore: string;
		costsLink: string;
		costsAfter: string;
		whoTitle: string;
		who1: string;
		who2: string;
		giveBefore: string;
		giveLink: string;
		giveAfter: string;
	};
	privacy: {
		title: string;
		metaDescription: string;
		stays: string;
		staysBody: string;
		exceptionTitle: string;
		exceptionBefore: string;
		exceptionAfter: string;
		exception2: string;
		switchOffLead: string;
		switchOffBody: string;
		/** The second source, plainly: opt-in, what it sends, and that Google is not a non-profit. */
		googleOptIn: string;
		covers: string;
		backupsTitle: string;
		backupsBody: string;
		hostingTitle: string;
		hostingBody: string;
		childrenTitle: string;
		childrenBody: string;
		trademarks: string;
	};
	support: {
		title: string;
		metaDescription: string;
		intro: string;
		helpsTitle: string;
		tellLead: string;
		tellBody: string;
		addLead: string;
		addBefore: string;
		addAfter: string;
		sayLead: string;
		sayBefore: string;
		sayAfter: string;
		giveTitle: string;
		give1: string;
		give2: string;
		contribute: string;
		trademark: string;
	};
	errorPage: {
		notFound: string;
		other: string;
		backHome: string;
	};
	ladder: {
		/**
		 * The twenty-one rungs, index 0 (no books finished yet) to 20 (the ladder full). Concrete nouns that climb, ground to cosmos, each plainly higher than the last — so a child can see the shape without reading a number, and so both languages can name the same thing rather than translating a joke.
		 */
		rungs: string[];
	};
}
