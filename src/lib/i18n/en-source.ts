import type { Messages } from './messages.ts';

/** English. The source language: this file defines the shape French must match. */
export const en: Messages = {
	nav: { scan: 'Scan', shelf: 'Shelf', badges: 'Badges', setup: 'Setup' },
	menu: { label: 'Menu', about: 'About', privacy: 'Privacy', support: 'Support this' },
	common: {
		loading: 'Loading…',
		save: 'Save',
		cancel: 'Cancel',
		close: 'Close',
		edit: 'Edit',
		delete: 'Delete',
		add: 'Add',
		search: 'Search',
		back: 'Back',
		none: 'None yet.',
		book: (count) => (count === 1 ? '1 book' : `${count} books`)
	},
	shelf: {
		title: 'Shelf',
		metaDescription: 'Every book the household owns, and how far up the ladder you are.',
		whoIsReading: 'Who is reading?',
		ladderProgress: (finished) => `Rung ${finished} of 20`,
		ladderFull: 'Top of the ladder, and still counting!',
		booksFinished: (count) => (count === 1 ? '1 book finished' : `${count} books finished`),
		pagesRead: (count) =>
			count === 1 ? '1 page read' : `${count.toLocaleString('en')} pages read`,
		readingNow: 'Reading now',
		startPrompt: 'Pick one off the shelf, or scan a new one.',
		empty: 'The shelf is empty.',
		emptyHint: 'Scan the first book, or add one by hand.',
		searchPlaceholder: 'Title or author',
		filterAll: 'All',
		filterReading: 'Reading',
		filterFinished: 'Finished',
		filterShelf: 'On the shelf',
		allLanguages: 'Any language',
		sortLabel: 'Sort',
		sortRecentlyAdded: 'Recently added',
		sortRecentlyRead: 'Recently read',
		sortTitle: 'Title A–Z',
		noMatches: 'Nothing matches. Try fewer filters.',
		byAuthor: (authors) => `by ${authors}`,
		pages: (n) => (n === 1 ? '1 page' : `${n} pages`),
		statusShelf: 'On the shelf',
		statusReading: 'Reading',
		statusFinished: 'Finished',
		startReading: 'Start reading',
		markFinished: 'I finished it!',
		readAgain: 'Read it again',
		readBefore: 'Mark as read',
		readOnLabel: 'Finished on',
		collectionsLabel: 'Collections',
		collectionsAll: 'All collections',
		collectionName: 'Name',
		collectionEmoji: 'Emoji',
		collectionAdd: 'New collection',
		collectionEdit: 'Edit collection',
		advanced: 'More details',
		collectionDeleteConfirm: (name: string) =>
			`Delete the collection "${name}"? The books in it stay on the shelf.`,
		unread: 'Not finished after all',
		unreadConfirm: (title) =>
			`Mark “${title}” as not finished? The ladder recounts itself. Badges already earned stay earned.`,
		editBook: 'Edit this book',
		adultBook: 'Adult book, hidden from children’s profiles',
		deleteBook: 'Delete this book',
		deleteConfirm: (title) =>
			`Delete “${title}”? It comes off the shelf along with who read it. Badges already earned stay earned.`,
		addedByHand: 'added by hand'
	},
	scan: {
		title: 'Scan',
		metaDescription: 'Point the camera at a barcode and the book fills itself in.',
		prompt: 'Point the camera at the barcode on the back of the book.',
		manualEntry: 'Type the number instead',
		isbnLabel: 'ISBN, the number under the barcode',
		isbnInvalid: 'That does not look like a book number. Have another look at the digits.',
		cameraUnavailable: 'The camera is not available here. You can type the number instead.',
		alreadyOnShelf: 'This one is already on your shelf.',
		viewExisting: 'Show me it',
		addAnyway: 'Add a second copy',
		scanning: 'Looking for a barcode…',
		addManually: 'Add a book with no barcode',
		titleLabel: 'Title',
		authorLabel: 'Author',
		pagesLabel: 'Pages',
		publisherLabel: 'Publisher',
		priceLabel: 'Price',
		locationLabel: 'Shelf spot',
		languageLabel: 'Language of the book',
		added: (title) => `${title} is on the shelf!`,
		searchingMetadata: 'Looking up the title and cover…',
		offlineQueued: 'No connection right now. The book is saved, and the details will arrive later.'
	},
	badges: {
		title: 'Badges',
		metaDescription: 'The badges you have earned, and the ones waiting for you.',
		earnedTitle: 'Earned',
		lockedTitle: 'Waiting for you',
		none: 'No badges yet. The first one is just one book away.',
		earnedOn: (date) => `Earned on ${date}`,
		statsTitle: 'In numbers',
		rereads: (count) => (count === 1 ? '1 book read again' : `${count} books read again`),
		familyTitle: 'The whole family',
		booksOnShelf: (count) => (count === 1 ? '1 book on the shelf' : `${count} books on the shelf`),
		ofShelfRead: 'of the shelf read',
		booksAMonth: 'books a month',
		pagesAMonth: 'pages a month',
		finishedInYear: (year) => `finished in ${year}`,
		longestBook: 'pages, your longest book',
		labels: {
			'first-book': 'First Book',
			'five-books': 'Five Books',
			'ten-books': 'Ten Books',
			'twenty-books': 'Twenty Books',
			cataloguer: 'Cataloguer',
			doorstop: 'Doorstop',
			'five-authors': 'Five Authors',
			'two-tongues': 'Two Tongues',
			polyglot: 'Polyglot'
		},
		descriptions: {
			'first-book': 'You finished a whole book.',
			'five-books': 'Five books finished. A proper little pile!',
			'ten-books': 'Ten books finished. That is a shelf of your own.',
			'twenty-books': 'Twenty books finished. The top of the ladder!',
			cataloguer:
				'You added a book the internet had never heard of. You typed it in yourself, so now it exists.',
			doorstop: 'You finished a book of more than four hundred pages. A big one!',
			'five-authors': 'You finished books by five different authors.',
			'two-tongues': 'You finished books in two different languages.',
			polyglot:
				'You finished books in three different languages. The whole world fits on your shelf.'
		}
	},
	setup: {
		title: 'Setup',
		metaDescription: 'Readers, language, lookup and backup.',

		readersTitle: 'Readers',
		addReader: 'Add a reader',
		readerName: 'Name',
		archiveReader: 'Archive this reader',
		renameReader: 'Edit name and avatar',
		adultReader: 'This reader is 16 or older',

		languageTitle: 'Language',
		followBrowser: (lang) => `Follow my device (${lang})`,

		lookupTitle: 'Book lookup',
		lookupExplain:
			'When you scan a book, its number is sent to a book database to fetch the title and cover. That request is the only thing that ever leaves this device.',
		lookupOn: 'Look books up for me',
		lookupOff: 'Off. I will type the details in myself',
		googleLookup: 'Also ask Google Books when Open Library comes up short',
		googleLookupExplain:
			'Off unless you turn it on. When Open Library does not know a book, or leaves details blank, the same number is also sent to Google Books to fill the gaps. The privacy page says exactly what that means.',

		backupTitle: 'Backup',
		backupExplain:
			'Your shelf lives in this browser and nowhere else. Save a copy from time to time, and keep it somewhere you would find it again.',
		storageNotGuaranteed:
			'The browser has not promised to keep this data forever. A backup file is the sure protection.',
		exportButton: 'Save a copy',
		importButton: 'Restore from a copy',
		importConfirm:
			'This replaces everything on the shelf with what is in the file. Save a copy of what you have first if you want to keep it.',
		importError: {
			'not-json': 'That file is not a backup. It is not the right kind of file.',
			'wrong-app': 'That backup belongs to another app.',
			'unsupported-version': 'That backup comes from a newer version of Coruja than this one.',
			malformed: 'That backup is damaged and could not be read.'
		},

		pinTitle: 'Family PIN',
		pinExplain:
			'With a PIN set, switching to an adult profile asks for it. That is what keeps adult books hidden from curious fingers. It is a child lock, not a vault.',
		pinPlaceholder: '4–8 digits',
		pinSet: 'Set the PIN',
		pinChange: 'Change',
		pinRemove: 'Remove',
		pinCurrent: 'Current PIN',
		pinNew: 'New PIN',
		pinInvalid: 'The PIN is 4 to 8 digits.',
		pinWrong: 'That is not the PIN.',
		pinPrompt: 'Family PIN?',
		aboutVersion: (version) => `Coruja ${version}`
	},
	about: {
		title: 'About coruja',
		metaDescription:
			'Coruja is a family reading tracker and book inventory that lives in your browser. Scan a book, it fills itself in, and finishing books climbs a ladder. Free, no account, works offline.',
		intro:
			'Coruja is a reading tracker and a book inventory for a family, and it lives in your browser. Scan the barcode on a book and it fills itself in: title, author, cover. Then say who is reading it. When somebody finishes a book they move up a rung on a ladder of twenty, and the book stays on the family shelf afterwards, because knowing what you own turns out to be half the point.',
		introNote:
			'There is nothing to log, no minutes to type, no pages to count. A book is on the shelf, being read, or finished. That is the whole system, and it is small enough for a seven-year-old to hold in her head.',
		nameTitle: 'The name, and the owl',
		name1:
			"Coruja is owl in Portuguese, and the owl earned this job three times over. Owls have kept company with wisdom for as long as anyone has drawn them: Athena's little owl sat on the shoulder of learning itself, and the bird still perches on library crests and bookplates today. Owls are also creatures of the night, which is when the best reading happens, under a lamp, past bedtime by a page or two. That is why the app wears indigo: the colour of the hour when stories are told.",
		name2:
			'But the reason the name is Portuguese is warmer than any of that. Pai coruja and mãe coruja, owl father and owl mother, is what Portuguese says for the parent who cannot stop showing off what their child just did. An owl parent watching a small reader climb: the name already contains the reason the app exists.',
		name3:
			"The mark tells the same story in three strokes. Two rings for the owl's wide eyes, which are also pages curling. Beneath them an open book, seen from the front. And the whole head is cocked, because that is the face everyone makes, at any age, when they are curious.",
		pronounce: 'It is said ko-ROO-zha, if you were wondering.',
		costsTitle: 'What it costs, and what it takes',
		costsBefore:
			'It is free. There is no account, nothing to sign up for and nobody to tell. Everything you add is stored in this browser, on this device, and it keeps working with the plane mode on. A book added on a train fills itself in later, by itself. One request ever leaves the device, and the',
		costsLink: 'privacy page',
		costsAfter: 'says exactly what it is and how to switch it off.',
		whoTitle: 'Who made it',
		who1: 'I built this for my daughter. She is almost eight and reads both by herself and with someone beside her. The idea arrived the way most good ones do: talking with other parents. Friends of ours mentioned they were tracking what their son reads, my godson, with a simple app. Just the books and the pages. And they were amazed at his progress, at how much a kid reads when the reading is visible. I wanted that for her, so I made this.',
		who2: 'She is the reason the ladder cannot go down, the reason nothing breaks a streak, and the reason not reading today is never shown in red.',
		giveBefore: 'If coruja earns a place in your family too, the',
		giveLink: 'support page',
		giveAfter: 'says what helps most. And if you feel like contributing:'
	},
	privacy: {
		title: 'Privacy',
		metaDescription:
			'Your shelf lives in this browser and nowhere else. No account, no analytics, no tracking. The one exception: scanning a book sends its ISBN to a book database to fetch the title and cover, and you can switch that off.',
		stays: 'Everything you add stays in this browser.',
		staysBody:
			"Readers, books, what is finished, which badges were earned: all of it is written to a database inside this browser on this device, and none of it is sent anywhere. There is no account, so there is nothing about you to hold. There is no analytics, no tracking, no advertising, no error reporting service, no third-party script and no font fetched from someone else's server.",
		exceptionTitle: 'The one exception',
		exceptionBefore: 'When you scan a book, the number from its barcode (its ISBN) is sent to',
		exceptionAfter:
			', the open book catalogue run by the non-profit Internet Archive. That is how the title, the author and the cover arrive without anybody typing them.',
		exception2:
			"Being plain about what that means: it tells Open Library that somebody at your address looked up that book, at that moment. Nothing else goes with it. Not who is reading it, not what is already on your shelf, not a name and not an identifier. There is no identifier to send. But it is a request to someone else's server, and that is the honest description of it.",
		switchOffLead: 'You can switch it off.',
		switchOffBody:
			'There is a switch in Setup, and with it off no request is made at all. The app stays completely usable: you type the title, the author and the page count yourself, and a book added that way counts exactly the same as any other. It even earns a badge.',
		googleOptIn:
			'There is a second source you can choose to add: Google Books. It is off unless you switch it on in Setup. With it on, a book Open Library does not know — or knows only half of — has the same number also sent to Google to fill the gaps. Nothing else goes with it, but Google is a company, not a non-profit, and that difference is why this is a separate switch rather than part of the first one.',
		covers:
			"A cover is fetched once and then kept in the local database, so the shelf still draws itself with no connection and the same cover is never asked for twice. The image itself comes from the Internet Archive's servers, the same non-profit that runs Open Library.",
		backupsTitle: 'Your backups are yours',
		backupsBody:
			"Saving a copy of your shelf produces a file, and that file goes wherever you put it. It is not uploaded and there is no copy of it here. That is the other half of the deal: because nothing is on a server, nothing can be recovered from one. If you clear this browser's data, or the shelf lives in a private window that you close, it is gone. The backup file is the only thing that survives that, so make one.",
		hostingTitle: 'Hosting, and how we know anyone uses this',
		hostingBody:
			"The app's files are served by Cloudflare. Like any host, Cloudflare sees the requests that fetch those files (the page, the icons, an update) with the network address they came from, and shows us aggregate counts of them. That is our whole picture of usage: enough to know the app is alive and roughly how many people open it, and nothing more. There is no analytics script in the app, no cookie, no identifier. And nothing that happens inside it, what is on your shelf or who reads what, is ever part of any request. The app's own security policy would block a tracking script even if one were added by mistake.",
		childrenTitle: 'Children',
		childrenBody:
			'This was written for a child to use. Nothing she does in it is collected, nothing is shared outward, there is no feed, no profile, no way to publish anything and no way for anyone to contact her through it.',
		trademarks:
			'Cloudflare is a trademark of Cloudflare, Inc. Open Library and Internet Archive are trademarks of the Internet Archive. Google Books is a trademark of Google LLC. None of them is affiliated with coruja; they are named because being exact about who sees what requires naming them.'
	},
	support: {
		title: 'Support',
		metaDescription: 'Coruja is free. Here is what actually helps.',
		intro:
			'Coruja is free, has no account and shows no advertising. That is not a trial. It is the point. A parent built it in evenings and weekends so his daughter would read more, and so reading would feel like climbing, not homework.',
		helpsTitle: 'What actually helps',
		tellLead: 'Tell another family.',
		tellBody:
			'A parent whose child is just starting to read alone is exactly who this is for. Word of mouth is the only distribution this app has.',
		addLead: 'Add a missing book to Open Library.',
		addBefore: 'When a scan comes up empty, the book is unknown to',
		addAfter:
			', the open catalogue coruja reads from. Anyone can add or fix a record there, and every family using coruja after you benefits. (Adding one in the app earns the Cataloguer badge either way.)',
		sayLead: 'Say what is wrong or missing.',
		sayBefore: 'Write to',
		sayAfter:
			'. The version you are running is shown at the bottom of Setup. Include it, and "it does the wrong thing" becomes answerable.',
		giveTitle: 'If you want to give something back',
		give1:
			'If coruja helps your child read more, and reading becomes something she is proud of, that is the reward this app was built for, and it costs you nothing. Truly: nothing here unlocks, and there is no subscription hiding behind a free trial.',
		give2:
			'If it has earned a place in your family and you feel like contributing, it goes toward keeping the app alive: the domain, yes, but also the evenings and weekends it is built in. And, fittingly, a book or two for the little reader it was made for.',
		contribute: 'Contribute with PayPal',
		trademark: 'PayPal is a trademark of PayPal, Inc., which is not affiliated with coruja.'
	},
	errorPage: {
		notFound: 'There is no page here. The owl looked.',
		other: 'Something went wrong on this page. Your shelf is untouched.',
		backHome: 'Back to the shelf'
	},
	ladder: {
		rungs: [
			'Nest',
			'Branch',
			'Treetop',
			'Rooftop',
			'Steeple',
			'Hill',
			'Tower',
			'Mountain',
			'Summit',
			'Cloud',
			'Balloon',
			'Aeroplane',
			'Rocket',
			'Satellite',
			'Moon',
			'Comet',
			'Sun',
			'Star',
			'Constellation',
			'Galaxy',
			'Night Sky'
		]
	}
};
