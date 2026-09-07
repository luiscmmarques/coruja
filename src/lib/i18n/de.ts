import type { Messages } from './messages.ts';

/**
 * German (international).
 *
 * Durchgehend du: die App spricht mit einem Kind über seine eigenen Bücher, und ein "Sie" würde einen Schalter zwischen das Kind und sein Regal stellen. Wer über die Schulter mitliest, ist nicht angesprochen.
 *
 * Frei von landestypischem Wortschatz, damit es in Berlin, in Bern und in Wien gleich selbstverständlich klingt: nichts, was die Schule oder die Buchhandlung eines einzelnen Landes voraussetzt. Rechtschreibung mit ß, weil das die weiteste Fassung ist und in der Schweiz trotzdem gelesen wird. "Badges" wird zu "Abzeichen": das ist das Wort, das Kinder von Pfadfindern und Sammelheften kennen, und es klingt nach etwas, das man sich holt.
 */
export const de: Messages = {
	nav: {
		scan: 'Scannen',
		shelf: 'Regal',
		badges: 'Abzeichen',
		setup: 'Einstellungen'
	},
	menu: { label: 'Menü', about: 'Über', privacy: 'Datenschutz', support: 'Unterstützen' },
	common: {
		loading: 'Lädt…',
		save: 'Speichern',
		cancel: 'Abbrechen',
		close: 'Schließen',
		edit: 'Bearbeiten',
		delete: 'Löschen',
		add: 'Hinzufügen',
		search: 'Suchen',
		back: 'Zurück',
		none: 'Noch keine.',
		book: (count) => (count === 1 ? '1 Buch' : `${count} Bücher`)
	},
	shelf: {
		title: 'Regal',
		metaDescription: 'Alle Bücher im Haus, und wie weit du auf der Leiter schon bist.',
		whoIsReading: 'Wer liest?',
		ladderProgress: (finished) => `Sprosse ${finished} von 20`,
		ladderFull: 'Ganz oben auf der Leiter, und es geht weiter!',
		booksFinished: (count) => (count === 1 ? '1 Buch beendet' : `${count} Bücher beendet`),
		pagesRead: (count) =>
			count === 1 ? '1 Seite gelesen' : `${count.toLocaleString('de')} Seiten gelesen`,
		readingNow: 'Du liest gerade',
		startPrompt: 'Nimm eins aus dem Regal, oder scanne ein neues.',
		empty: 'Das Regal ist leer.',
		emptyHint: 'Scanne das erste Buch, oder trag eines von Hand ein.',
		searchPlaceholder: 'Titel oder Autor',
		filterAll: 'Alle',
		filterReading: 'Angefangen',
		filterFinished: 'Beendet',
		filterShelf: 'Im Regal',
		allLanguages: 'Alle Sprachen',
		sortLabel: 'Sortieren',
		sortRecentlyAdded: 'Zuletzt hinzugefügt',
		sortRecentlyRead: 'Zuletzt gelesen',
		sortTitle: 'Titel A–Z',
		noMatches: 'Dazu passt nichts. Nimm ein paar Filter weg.',
		byAuthor: (authors) => `von ${authors}`,
		pages: (n) => (n === 1 ? '1 Seite' : `${n} Seiten`),
		statusShelf: 'Im Regal',
		statusReading: 'Angefangen',
		statusFinished: 'Beendet',
		startReading: 'Lesen anfangen',
		markFinished: 'Ich bin fertig!',
		readBefore: 'Als gelesen markieren',
		readOnLabel: 'Beendet am',
		collectionsLabel: 'Sammlungen',
		collectionsAll: 'Alle Sammlungen',
		collectionName: 'Name',
		collectionEmoji: 'Emoji',
		collectionAdd: 'Neue Sammlung',
		collectionEdit: 'Sammlung bearbeiten',
		advanced: 'Mehr Details',
		collectionDeleteConfirm: (name: string) =>
			`Die Sammlung „${name}“ löschen? Die Bücher darin bleiben im Regal.`,
		readAgain: 'Nochmal lesen',
		unread: 'Doch noch nicht fertig',
		unreadConfirm: (title) =>
			`„${title}“ als nicht beendet markieren? Die Leiter zählt neu. Abzeichen, die du schon hast, bleiben dir.`,
		editBook: 'Dieses Buch bearbeiten',
		adultBook: 'Buch für Erwachsene, in Kinderprofilen ausgeblendet',
		deleteBook: 'Dieses Buch löschen',
		deleteConfirm: (title) =>
			`„${title}“ löschen? Es verschwindet aus dem Regal, samt seiner Lesegeschichte. Abzeichen, die du schon hast, bleiben dir.`,
		addedByHand: 'von Hand eingetragen'
	},
	scan: {
		title: 'Scannen',
		metaDescription: 'Halte die Kamera auf einen Barcode, und das Buch trägt sich selbst ein.',
		prompt: 'Halte die Kamera auf den Barcode auf der Rückseite des Buches.',
		manualEntry: 'Die Nummer stattdessen eintippen',
		isbnLabel: 'ISBN, die Nummer unter dem Barcode',
		isbnInvalid: 'Das sieht nicht wie eine Buchnummer aus. Schau die Ziffern nochmal an.',
		cameraUnavailable:
			'Die Kamera ist hier nicht verfügbar. Du kannst die Nummer stattdessen eintippen.',
		alreadyOnShelf: 'Dieses Buch steht schon in deinem Regal.',
		viewExisting: 'Zeig es mir',
		addAnyway: 'Ein zweites Exemplar hinzufügen',
		scanning: 'Suche nach einem Barcode…',
		addManually: 'Ein Buch ohne Barcode hinzufügen',
		titleLabel: 'Titel',
		authorLabel: 'Autor',
		pagesLabel: 'Seiten',
		publisherLabel: 'Verlag',
		priceLabel: 'Preis',
		locationLabel: 'Standort',
		languageLabel: 'Sprache des Buches',
		added: (title) => `${title} steht jetzt im Regal!`,
		searchingMetadata: 'Suche nach Titel und Cover…',
		offlineQueued:
			'Gerade keine Verbindung. Das Buch ist gespeichert, und die Details kommen später dazu.'
	},
	badges: {
		title: 'Abzeichen',
		metaDescription: 'Die Abzeichen, die du schon hast, und die, die auf dich warten.',
		earnedTitle: 'Geschafft',
		lockedTitle: 'Warten auf dich',
		none: 'Noch keine Abzeichen. Bis zum ersten ist es nur ein Buch.',
		earnedOn: (date) => `Geschafft am ${date}`,
		statsTitle: 'In Zahlen',
		rereads: (count) =>
			count === 1 ? '1 Buch nochmal gelesen' : `${count} Bücher nochmal gelesen`,
		familyTitle: 'Die ganze Familie',
		booksOnShelf: (count) => (count === 1 ? '1 Buch im Regal' : `${count} Bücher im Regal`),
		ofShelfRead: 'vom Regal gelesen',
		booksAMonth: 'Bücher pro Monat',
		pagesAMonth: 'Seiten pro Monat',
		finishedInYear: (year) => `beendet ${year}`,
		longestBook: 'Seiten, dein längstes Buch',
		labels: {
			'first-book': 'Erstes Buch',
			'five-books': 'Fünf Bücher',
			'ten-books': 'Zehn Bücher',
			'twenty-books': 'Zwanzig Bücher',
			cataloguer: 'Buchentdecker',
			doorstop: 'Wälzer',
			'five-authors': 'Fünf Autoren',
			'two-tongues': 'Zwei Sprachen',
			polyglot: 'Sprachtalent'
		},
		descriptions: {
			'first-book': 'Du hast ein ganzes Buch gelesen.',
			'five-books': 'Fünf Bücher beendet. Das ist schon ein kleiner Stapel!',
			'ten-books': 'Zehn Bücher beendet. Damit füllst du ein eigenes Regal.',
			'twenty-books': 'Zwanzig Bücher beendet. Ganz oben auf der Leiter!',
			cataloguer:
				'Du hast ein Buch hinzugefügt, von dem das Internet noch nie gehört hat. Du hast es selbst eingetragen, also gibt es das Buch jetzt.',
			doorstop: 'Du hast ein Buch mit mehr als vierhundert Seiten beendet. Ein dicker!',
			'five-authors': 'Du hast Bücher von fünf verschiedenen Autoren gelesen.',
			'two-tongues': 'Du hast Bücher in zwei verschiedenen Sprachen gelesen.',
			polyglot:
				'Du hast Bücher in drei verschiedenen Sprachen gelesen. Die ganze Welt passt in dein Regal.'
		}
	},
	setup: {
		title: 'Einstellungen',
		metaDescription: 'Leser, Sprache, Buchsuche und Sicherung.',

		readersTitle: 'Leser',
		addReader: 'Leser hinzufügen',
		readerName: 'Name',
		archiveReader: 'Diesen Leser archivieren',
		renameReader: 'Name und Avatar bearbeiten',
		adultReader: 'Diese Leserin oder dieser Leser ist 16 oder älter',

		languageTitle: 'Sprache',
		followBrowser: (lang) => `Meinem Gerät folgen (${lang})`,

		lookupTitle: 'Buchsuche',
		lookupExplain:
			'Wenn du ein Buch scannst, wird seine Nummer an eine Buchdatenbank geschickt, um Titel und Cover zu holen. Diese Anfrage ist das Einzige, was dieses Gerät je verlässt.',
		lookupOn: 'Bücher für mich suchen',
		lookupOff: 'Aus. Ich trage die Details selbst ein',

		backupTitle: 'Sicherung',
		backupExplain:
			'Dein Regal liegt in diesem Browser und nirgendwo sonst. Speichere von Zeit zu Zeit eine Kopie, und leg sie dorthin, wo du sie wiederfindest.',
		storageNotGuaranteed:
			'Der Browser hat nicht versprochen, diese Daten für immer zu behalten. Eine Sicherungsdatei ist der sichere Schutz.',
		exportButton: 'Eine Kopie speichern',
		importButton: 'Aus einer Kopie zurückholen',
		importConfirm:
			'Das ersetzt alles im Regal durch den Inhalt der Datei. Speichere vorher eine Kopie von dem, was du hast, wenn du es behalten willst.',
		importError: {
			'not-json': 'Diese Datei ist keine Sicherung. Es ist nicht die richtige Art von Datei.',
			'wrong-app': 'Diese Sicherung gehört zu einer anderen App.',
			'unsupported-version':
				'Diese Sicherung kommt aus einer neueren Version von Coruja als dieser hier.',
			malformed: 'Diese Sicherung ist beschädigt und konnte nicht gelesen werden.'
		},

		pinTitle: 'Familien-PIN',
		pinExplain:
			'Wenn eine PIN gesetzt ist, wird sie beim Wechsel auf ein Erwachsenenprofil abgefragt. Das hält Bücher für Erwachsene von neugierigen Fingern fern. Eine Kindersicherung, kein Tresor.',
		pinPlaceholder: '4 bis 8 Ziffern',
		pinSet: 'PIN festlegen',
		pinChange: 'Ändern',
		pinRemove: 'Entfernen',
		pinCurrent: 'Aktuelle PIN',
		pinNew: 'Neue PIN',
		pinInvalid: 'Die PIN hat 4 bis 8 Ziffern.',
		pinWrong: 'Das ist nicht die PIN.',
		pinPrompt: 'Familien-PIN?',
		aboutVersion: (version) => `Coruja ${version}`
	},
	about: {
		title: 'Über Coruja',
		metaDescription:
			'Coruja hält fest, was deine Familie liest, und welche Bücher bei euch im Regal stehen, und das direkt im Browser. Buch scannen, und es trägt sich selbst ein. Jedes beendete Buch führt eine Sprosse höher. Kostenlos, ohne Konto, auch offline.',
		intro:
			'Coruja hält fest, was in einer Familie gelesen wird, und welche Bücher bei euch im Haus stehen, und das alles in deinem Browser. Scanne den Barcode auf einem Buch, und es trägt sich selbst ein: Titel, Autor, Cover. Dann sagst du, wer es liest. Wer ein Buch beendet, steigt eine Sprosse höher auf einer Leiter mit zwanzig Stufen, und das Buch bleibt danach im Familienregal stehen, denn zu wissen, was man hat, ist am Ende genauso wichtig.',
		introNote:
			'Es gibt nichts zu protokollieren, keine Minuten einzutippen, keine Seiten zu zählen. Ein Buch steht im Regal, ist angefangen oder ist beendet. Das ist das ganze System, und es ist klein genug, dass eine Siebenjährige es im Kopf behält.',
		nameTitle: 'Der Name, und die Eule',
		name1:
			'Coruja ist Portugiesisch für Eule, und die Eule hat sich diesen Job dreifach verdient. Eulen halten der Weisheit Gesellschaft, so lange sie überhaupt jemand zeichnet: Athenes kleine Eule saß dem Lernen selbst auf der Schulter, und noch heute sitzt der Vogel auf Bibliothekswappen und Exlibris. Eulen sind außerdem Wesen der Nacht, und da passiert das beste Lesen, unter einer Lampe, ein paar Seiten über die Schlafenszeit hinaus. Darum trägt die App Indigo: die Farbe der Stunde, in der Geschichten erzählt werden.',
		name2:
			'Der Grund für den portugiesischen Namen ist aber wärmer als all das. Pai coruja und mãe coruja, Eulenvater und Eulenmutter, sagt das Portugiesische für Eltern, die nicht aufhören können zu erzählen, was ihr Kind gerade geschafft hat. Ein Eulenelternteil, das einer kleinen Leserin beim Klettern zusieht: im Namen steckt schon der Grund, warum es diese App gibt.',
		name3:
			'Das Zeichen erzählt dasselbe in drei Strichen. Zwei Ringe für die weiten Augen der Eule, die gleichzeitig sich wellende Seiten sind. Darunter ein offenes Buch, von vorn gesehen. Und der ganze Kopf ist schief gelegt, weil das das Gesicht ist, das alle machen, in jedem Alter, wenn sie neugierig sind.',
		pronounce:
			'Ausgesprochen ko-RU-scha, mit dem weichen sch wie in „Journal“, falls du dich gefragt hast.',
		costsTitle: 'Was es kostet, und was es braucht',
		costsBefore:
			'Es ist kostenlos. Es gibt kein Konto, nichts, wofür man sich anmelden muss, und niemanden, dem man Bescheid geben muss. Alles, was du hinzufügst, liegt in diesem Browser, auf diesem Gerät, und es funktioniert auch im Flugmodus weiter. Ein Buch, das du im Zug hinzufügst, trägt sich später von selbst nach. Eine einzige Anfrage verlässt je dieses Gerät, und die',
		costsLink: 'Datenschutzseite',
		costsAfter: 'sagt genau, welche das ist und wie du sie abschaltest.',
		whoTitle: 'Wer es gemacht hat',
		who1: 'Ich habe das für meine Tochter gebaut. Sie ist bald acht und liest sowohl allein als auch mit jemandem an ihrer Seite. Die Idee kam so, wie gute Ideen meistens kommen: im Gespräch mit anderen Eltern. Freunde von uns erzählten, dass sie mit einer einfachen App festhalten, was ihr Sohn liest, mein Patenkind. Nur die Bücher und die Seiten. Und sie staunten über seine Fortschritte, darüber, wie viel ein Kind liest, wenn das Lesen sichtbar wird. Das wollte ich für sie, also habe ich das hier gemacht.',
		who2: 'Sie ist der Grund, warum die Leiter nicht nach unten gehen kann, warum nichts eine Serie zerreißt und warum ein Tag ohne Lesen nie in Rot erscheint.',
		giveBefore: 'Wenn Coruja auch bei dir in der Familie einen Platz findet: die',
		giveLink: 'Unterstützen-Seite',
		giveAfter: 'nennt, was am meisten hilft. Und wenn du etwas beitragen möchtest:'
	},
	privacy: {
		title: 'Datenschutz',
		metaDescription:
			'Dein Regal liegt in diesem Browser und nirgendwo sonst. Kein Konto, keine Analyse, kein Tracking. Die eine Ausnahme: Beim Scannen geht die ISBN an eine Buchdatenbank, um Titel und Cover zu holen, und das kannst du abschalten.',
		stays: 'Alles, was du hinzufügst, bleibt in diesem Browser.',
		staysBody:
			'Leser, Bücher, was beendet ist, welche Abzeichen geschafft sind: alles davon wird in eine Datenbank in diesem Browser auf diesem Gerät geschrieben, und nichts davon wird irgendwohin geschickt. Es gibt kein Konto, also gibt es nichts über dich zu speichern. Es gibt keine Analyse, kein Tracking, keine Werbung, keinen Dienst für Fehlerberichte, kein Skript von Dritten und keine Schrift, die von einem fremden Server geholt wird.',
		exceptionTitle: 'Die eine Ausnahme',
		exceptionBefore: 'Wenn du ein Buch scannst, wird die Nummer von seinem Barcode (die ISBN) an',
		exceptionAfter:
			' geschickt, den offenen Buchkatalog der gemeinnützigen Organisation Internet Archive. So kommen Titel, Autor und Cover an, ohne dass jemand sie eintippt.',
		exception2:
			'Ganz offen, was das bedeutet: Open Library erfährt, dass jemand von deiner Adresse dieses Buch nachgesehen hat, in diesem Moment. Mehr geht nicht mit. Nicht, wer es liest, nicht, was schon in deinem Regal steht, kein Name und keine Kennung. Es gibt keine Kennung zum Mitschicken. Aber es ist eine Anfrage an einen fremden Server, und das ist die ehrliche Beschreibung davon.',
		switchOffLead: 'Du kannst es abschalten.',
		switchOffBody:
			'In den Einstellungen gibt es einen Schalter, und wenn er aus ist, wird überhaupt keine Anfrage gestellt. Die App bleibt vollständig brauchbar: du tippst Titel, Autor und Seitenzahl selbst ein, und ein so hinzugefügtes Buch zählt genau wie jedes andere. Es bringt sogar ein Abzeichen.',
		covers:
			'Ein Cover wird einmal geholt und dann in der Datenbank hier behalten, damit sich das Regal auch ohne Verbindung zeichnet und dasselbe Cover nie zweimal angefragt wird. Das Bild selbst kommt von den Servern des Internet Archive, derselben gemeinnützigen Organisation, die Open Library betreibt.',
		backupsTitle: 'Deine Sicherungen gehören dir',
		backupsBody:
			'Wenn du eine Kopie deines Regals speicherst, entsteht eine Datei, und die geht dorthin, wo du sie hinlegst. Sie wird nicht hochgeladen, und hier liegt keine Kopie davon. Das ist die andere Hälfte der Abmachung: weil nichts auf einem Server liegt, kann von einem Server auch nichts zurückgeholt werden. Wenn du die Daten dieses Browsers löschst, oder wenn das Regal in einem privaten Fenster liegt, das du schließt, ist es weg. Die Sicherungsdatei ist das Einzige, was das übersteht, also mach eine.',
		hostingTitle: 'Hosting, und woher wir wissen, dass das jemand benutzt',
		hostingBody:
			'Die Dateien der App liefert Cloudflare aus. Wie jeder Hoster sieht Cloudflare die Anfragen, die diese Dateien holen (die Seite, die Symbole, ein Update), mit der Netzwerkadresse, von der sie kamen, und zeigt uns zusammengefasste Zahlen dazu. Das ist unser ganzes Bild von der Nutzung: genug, um zu wissen, dass die App lebt und ungefähr wie viele Leute sie öffnen, und nicht mehr. In der App steckt kein Analyse-Skript, kein Cookie, keine Kennung. Und nichts von dem, was darin passiert, was in deinem Regal steht oder wer was liest, ist je Teil einer Anfrage. Die Sicherheitsregeln der App würden ein Tracking-Skript blockieren, selbst wenn aus Versehen eines dazukäme.',
		childrenTitle: 'Kinder',
		childrenBody:
			'Das hier ist dafür geschrieben, dass ein Kind es benutzt. Nichts, was es darin tut, wird gesammelt, nichts wird nach außen geteilt, es gibt keinen Feed, kein Profil, keine Möglichkeit, etwas zu veröffentlichen, und keine Möglichkeit, das Kind darüber zu erreichen.',
		trademarks:
			'Cloudflare ist eine Marke von Cloudflare, Inc. Open Library und Internet Archive sind Marken des Internet Archive. Keines von beiden gehört zu Coruja; sie sind genannt, weil man sie nennen muss, um genau zu sagen, wer was sieht.'
	},
	support: {
		title: 'Unterstützen',
		metaDescription: 'Coruja ist kostenlos. Hier steht, was wirklich hilft.',
		intro:
			'Coruja ist kostenlos, hat kein Konto und zeigt keine Werbung. Das ist keine Testphase. Das ist der Sinn der Sache. Ein Vater hat es an Abenden und Wochenenden gebaut, damit seine Tochter mehr liest, und damit Lesen sich wie Klettern anfühlt und nicht wie Hausaufgaben.',
		helpsTitle: 'Was wirklich hilft',
		tellLead: 'Erzähl einer anderen Familie davon.',
		tellBody:
			'Eltern, deren Kind gerade anfängt, allein zu lesen, sind genau die, für die das hier gemacht ist. Weitersagen ist die einzige Verbreitung, die diese App hat.',
		addLead: 'Trag ein fehlendes Buch bei Open Library ein.',
		addBefore: 'Wenn ein Scan leer bleibt, ist das Buch unbekannt bei',
		addAfter:
			', dem offenen Katalog, aus dem Coruja liest. Dort kann jeder einen Eintrag anlegen oder korrigieren, und jede Familie, die Coruja nach dir benutzt, hat etwas davon. (Ein Buch in der App selbst einzutragen bringt so oder so das Abzeichen „Buchentdecker“.)',
		sayLead: 'Sag, was falsch ist oder fehlt.',
		sayBefore: 'Schreib an',
		sayAfter:
			'. Die Version, die du benutzt, steht unten in den Einstellungen. Schreib sie dazu, dann wird aus „es macht das Falsche“ etwas, das man beantworten kann.',
		giveTitle: 'Wenn du etwas zurückgeben möchtest',
		give1:
			'Wenn Coruja deinem Kind hilft, mehr zu lesen, und wenn Lesen etwas wird, worauf es stolz ist, dann ist das der Lohn, für den diese App gebaut wurde, und er kostet dich nichts. Wirklich: hier schaltet sich nichts frei, und hinter der kostenlosen Nutzung versteckt sich kein Abo.',
		give2:
			'Wenn sie bei dir in der Familie einen Platz gefunden hat und du etwas beitragen möchtest, geht das in den Erhalt der App: die Domain, ja, aber auch die Abende und Wochenenden, in denen sie entsteht. Und, passenderweise, in ein Buch oder zwei für die kleine Leserin, für die sie gemacht wurde.',
		contribute: 'Mit PayPal beitragen',
		trademark: 'PayPal ist eine Marke von PayPal, Inc., die nicht zu Coruja gehört.'
	},
	errorPage: {
		notFound: 'Hier ist keine Seite. Die Eule hat nachgesehen.',
		other: 'Auf dieser Seite ist etwas schiefgegangen. Dein Regal ist unberührt.',
		backHome: 'Zurück zum Regal'
	},
	ladder: {
		rungs: [
			'Nest',
			'Ast',
			'Wipfel',
			'Dach',
			'Kirchturm',
			'Hügel',
			'Turm',
			'Berg',
			'Gipfel',
			'Wolke',
			'Ballon',
			'Flugzeug',
			'Rakete',
			'Satellit',
			'Mond',
			'Komet',
			'Sonne',
			'Stern',
			'Sternbild',
			'Galaxie',
			'Nachthimmel'
		]
	}
};
