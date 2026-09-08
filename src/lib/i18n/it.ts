import type { Messages } from './messages.ts';

/**
 * Italian (international).
 *
 * Informal "tu" throughout: the app talks to a child about her own books, and "lei" would seat a clerk between her and the shelf. A parent reading over her shoulder is not the one being addressed.
 *
 * Free of regional vocabulary so it reads the same way in Rome, in Milan and in Lugano: nothing that assumes one country's schools, bookshops or software habits. "Badge" stays "Badge", the word Italian children use in games and apps; "distintivi" belongs to a uniform or a scout troop, not to a game.
 *
 * Where a phrase could gender the reader ("da solo" / "da sola"), it is rewritten rather than guessed: the app never learns whether the child is a girl or a boy, and it should not pretend to. The ladder is climbed by "gradini", the step every child names, rather than by the joiner's "pioli".
 */
export const it: Messages = {
	nav: {
		scan: 'Scansiona',
		shelf: 'Scaffale',
		badges: 'Badge',
		setup: 'Impostazioni'
	},
	menu: { label: 'Menu', about: 'Informazioni', privacy: 'Privacy', support: 'Sostienici' },
	common: {
		loading: 'Caricamento…',
		save: 'Salva',
		cancel: 'Annulla',
		close: 'Chiudi',
		edit: 'Modifica',
		delete: 'Elimina',
		add: 'Aggiungi',
		search: 'Cerca',
		back: 'Indietro',
		none: 'Ancora nessuno.',
		book: (count) => (count === 1 ? '1 libro' : `${count} libri`)
	},
	shelf: {
		title: 'Scaffale',
		metaDescription: 'Tutti i libri di casa, e a che punto sei sulla scala.',
		whoIsReading: 'Chi sta leggendo?',
		ladderProgress: (finished) => `Gradino ${finished} di 20`,
		ladderFull: 'In cima alla scala, e la conta continua!',
		booksFinished: (count) => (count === 1 ? '1 libro finito' : `${count} libri finiti`),
		pagesRead: (count) =>
			count === 1 ? '1 pagina letta' : `${count.toLocaleString('it')} pagine lette`,
		readingNow: 'Stai leggendo',
		startPrompt: 'Scegline uno dallo scaffale, o scansiona un libro nuovo.',
		empty: 'Lo scaffale è vuoto.',
		emptyHint: 'Scansiona il primo libro, o aggiungine uno a mano.',
		searchPlaceholder: 'Titolo o autore',
		filterAll: 'Tutti',
		filterReading: 'In lettura',
		filterFinished: 'Finiti',
		filterShelf: 'Sullo scaffale',
		allLanguages: 'Tutte le lingue',
		sortLabel: 'Ordina',
		sortRecentlyAdded: 'Aggiunti di recente',
		sortRecentlyRead: 'Letti di recente',
		sortTitle: 'Titolo A–Z',
		noMatches: 'Nessun risultato. Prova con meno filtri.',
		byAuthor: (authors) => `di ${authors}`,
		pages: (n) => (n === 1 ? '1 pagina' : `${n} pagine`),
		statusShelf: 'Sullo scaffale',
		statusReading: 'In lettura',
		statusFinished: 'Finito',
		startReading: 'Inizia a leggere',
		markFinished: 'L’ho finito!',
		readBefore: 'Segna come letto',
		readOnLabel: 'Finito il',
		collectionsLabel: 'Collezioni',
		collectionsAll: 'Tutte le collezioni',
		collectionName: 'Nome',
		collectionEmoji: 'Emoji',
		collectionAdd: 'Nuova collezione',
		collectionEdit: 'Modifica collezione',
		advanced: 'Altri dettagli',
		collectionDeleteConfirm: (name: string) =>
			`Eliminare la collezione “${name}”? I libri restano sullo scaffale.`,
		readAgain: 'Rileggilo',
		unread: 'In realtà non l’ho finito',
		unreadConfirm: (title) =>
			`Segnare «${title}» come non finito? La scala si riconta. I badge già conquistati restano tuoi.`,
		editBook: 'Modifica questo libro',
		adultBook: 'Libro per adulti, nascosto nei profili dei bambini',
		deleteBook: 'Elimina questo libro',
		deleteConfirm: (title) =>
			`Eliminare «${title}»? Esce dallo scaffale insieme a chi lo ha letto. I badge già conquistati restano tuoi.`,
		addedByHand: 'aggiunto a mano'
	},
	scan: {
		title: 'Scansiona',
		metaDescription: 'Inquadra il codice a barre e il libro si compila da solo.',
		prompt: 'Inquadra il codice a barre sul retro del libro.',
		manualEntry: 'Scrivi il numero a mano',
		isbnLabel: 'ISBN, il numero sotto il codice a barre',
		isbnInvalid: 'Questo non sembra un numero di libro. Ricontrolla le cifre.',
		cameraUnavailable: 'Qui la fotocamera non è disponibile. Puoi scrivere il numero a mano.',
		alreadyOnShelf: 'Questo è già sul tuo scaffale.',
		viewExisting: 'Mostramelo',
		addAnyway: 'Aggiungi una seconda copia',
		scanning: 'Cerco un codice a barre…',
		addManually: 'Aggiungi un libro senza codice a barre',
		titleLabel: 'Titolo',
		authorLabel: 'Autore',
		pagesLabel: 'Pagine',
		publisherLabel: 'Editore',
		priceLabel: 'Prezzo',
		locationLabel: 'Posizione',
		languageLabel: 'Lingua del libro',
		added: (title) => `${title} è sullo scaffale!`,
		searchingMetadata: 'Cerco il titolo e la copertina…',
		offlineQueued:
			'Adesso non c’è connessione. Il libro è salvato, e i dettagli arriveranno più tardi.'
	},
	badges: {
		title: 'Badge',
		metaDescription: 'I badge che hai conquistato, e quelli che ti aspettano.',
		earnedTitle: 'Conquistati',
		lockedTitle: 'Ti aspettano',
		none: 'Ancora nessun badge. Il primo è a un libro di distanza.',
		earnedOn: (date) => `Conquistato il ${date}`,
		statsTitle: 'In numeri',
		rereads: (count) => (count === 1 ? '1 libro riletto' : `${count} libri riletti`),
		familyTitle: 'Tutta la famiglia',
		booksOnShelf: (count) =>
			count === 1 ? '1 libro sullo scaffale' : `${count} libri sullo scaffale`,
		ofShelfRead: 'dello scaffale letto',
		booksAMonth: 'libri al mese',
		pagesAMonth: 'pagine al mese',
		finishedInYear: (year) => `finiti nel ${year}`,
		longestBook: 'pagine, il tuo libro più lungo',
		labels: {
			'first-book': 'Primo libro',
			'five-books': 'Cinque libri',
			'ten-books': 'Dieci libri',
			'twenty-books': 'Venti libri',
			cataloguer: 'Catalogatore',
			doorstop: 'Mattone',
			'five-authors': 'Cinque autori',
			'two-tongues': 'Due lingue',
			polyglot: 'Poliglotta'
		},
		descriptions: {
			'first-book': 'Hai finito un libro intero.',
			'five-books': 'Cinque libri finiti. Una bella pila!',
			'ten-books': 'Dieci libri finiti. Ci riempi uno scaffale tutto tuo.',
			'twenty-books': 'Venti libri finiti. In cima alla scala!',
			cataloguer:
				'Hai aggiunto un libro di cui internet non aveva mai sentito parlare. L’hai scritto tu, quindi adesso esiste.',
			doorstop: 'Hai finito un libro di più di quattrocento pagine. Un bel mattone!',
			'five-authors': 'Hai finito libri di cinque autori diversi.',
			'two-tongues': 'Hai finito libri in due lingue diverse.',
			polyglot: 'Hai finito libri in tre lingue diverse. Il mondo intero sta sul tuo scaffale.'
		}
	},
	setup: {
		title: 'Impostazioni',
		metaDescription: 'Lettori, lingua, ricerca dei libri e backup.',

		readersTitle: 'Lettori',
		addReader: 'Aggiungi un lettore',
		readerName: 'Nome',
		archiveReader: 'Archivia questo lettore',
		renameReader: 'Modifica il nome e l’avatar',
		adultReader: 'Questo lettore ha 16 anni o più',

		languageTitle: 'Lingua',
		followBrowser: (lang) => `Segui il mio dispositivo (${lang})`,

		lookupTitle: 'Ricerca dei libri',
		lookupExplain:
			'Quando scansioni un libro, il suo numero viene inviato a un database di libri per recuperare il titolo e la copertina. Quella richiesta è l’unica cosa che esce da questo dispositivo.',
		lookupOn: 'Cerca i libri per me',
		lookupOff: 'Disattivata. I dettagli li scrivo io',
		googleLookup: 'Chiedi anche a Google Books quando Open Library non basta',
		googleLookupExplain:
			'Spento finché non lo accendi tu. Quando Open Library non conosce un libro, o lascia dei dettagli vuoti, lo stesso numero viene inviato anche a Google Books per colmare le lacune. La pagina della privacy dice esattamente cosa significa.',

		backupTitle: 'Backup',
		backupExplain:
			'Il tuo scaffale vive in questo browser e in nessun altro posto. Salva una copia di tanto in tanto, e tienila dove sai di ritrovarla.',
		storageNotGuaranteed:
			'Il browser non ha promesso di conservare questi dati per sempre. Un file di backup è la vera protezione.',
		exportButton: 'Salva una copia',
		importButton: 'Ripristina da una copia',
		importConfirm:
			'Questo sostituisce tutto quello che c’è sullo scaffale con il contenuto del file. Se vuoi tenere quello che hai adesso, salvane prima una copia.',
		importError: {
			'not-json': 'Questo file non è un backup. Non è il tipo di file giusto.',
			'wrong-app': 'Questo backup appartiene a un’altra app.',
			'unsupported-version':
				'Questo backup arriva da una versione di Coruja più recente di questa.',
			malformed: 'Questo backup è danneggiato e non è stato possibile leggerlo.'
		},

		pinTitle: 'PIN di famiglia',
		pinExplain:
			'Con un PIN attivo, per passare a un profilo adulto bisogna inserirlo. È così che i libri per adulti restano al riparo dalle dita curiose. È una sicura per bambini, non una cassaforte.',
		pinPlaceholder: 'da 4 a 8 cifre',
		pinSet: 'Imposta il PIN',
		pinChange: 'Modifica',
		pinRemove: 'Rimuovi',
		pinCurrent: 'PIN attuale',
		pinNew: 'Nuovo PIN',
		pinInvalid: 'Il PIN ha da 4 a 8 cifre.',
		pinWrong: 'Il PIN non è questo.',
		pinPrompt: 'PIN di famiglia?',
		aboutVersion: (version) => `Coruja ${version}`
	},
	about: {
		title: 'Informazioni su Coruja',
		metaDescription:
			'Coruja è un diario di lettura e un inventario dei libri per tutta la famiglia, e vive nel tuo browser. Scansiona un libro e si compila da solo, e ogni libro finito è un gradino in più sulla scala. Gratuita, senza account, funziona anche offline.',
		intro:
			'Coruja è un diario di lettura e un inventario dei libri per una famiglia, e vive nel tuo browser. Scansiona il codice a barre di un libro e si compila da solo: titolo, autore, copertina. Poi dici chi lo sta leggendo. Quando qualcuno finisce un libro sale di un gradino su una scala di venti, e il libro resta sullo scaffale di casa, perché sapere quali libri hai in casa, alla fine, conta quasi altrettanto.',
		introNote:
			'Non c’è niente da registrare, nessun minuto da digitare, nessuna pagina da contare. Un libro è sullo scaffale, in lettura, o finito. Il sistema è tutto qui, ed è abbastanza semplice da starci in testa a chi ha sette anni.',
		nameTitle: 'Il nome, e la civetta',
		name1:
			'Coruja in portoghese vuol dire civetta, e la civetta si è guadagnata questo posto tre volte. Le civette accompagnano la sapienza da quando qualcuno ha cominciato a disegnarle: la civetta di Atena stava sulla spalla del sapere in persona, e ancora oggi quell’uccello si posa sugli stemmi delle biblioteche e sugli ex libris. Le civette sono anche creature della notte, che è il momento in cui si legge meglio, sotto una lampada, un paio di pagine oltre l’ora di dormire. Per questo l’app veste di indaco: il colore dell’ora in cui si raccontano le storie.',
		name2:
			'Ma il motivo per cui il nome è portoghese è più tenero di tutto questo. Pai coruja e mãe coruja, padre civetta e madre civetta, è come il portoghese chiama il genitore che non riesce a smettere di raccontare a tutti quello che ha appena fatto suo figlio. Un genitore civetta che guarda un piccolo lettore salire: il nome contiene già il motivo per cui questa app esiste.',
		name3:
			'Il logo racconta la stessa storia in tre segni. Due cerchi per gli occhi spalancati della civetta, che sono anche pagine che si arricciano. Sotto, un libro aperto, visto di fronte. E tutta la testa è inclinata di lato, perché è la faccia che facciamo tutti, a qualsiasi età, quando siamo curiosi.',
		pronounce: 'Si pronuncia ko-RÙ-gia, con la g dolce di «gelato», se te lo stavi chiedendo.',
		costsTitle: 'Quanto costa, e cosa chiede in cambio',
		costsBefore:
			'È gratuita. Non c’è nessun account, niente a cui iscriversi e nessuno da avvisare. Tutto quello che aggiungi è salvato in questo browser, su questo dispositivo, e continua a funzionare con la modalità aereo attiva. Un libro aggiunto in treno si compila più tardi, da solo. Una sola richiesta esce da questo dispositivo, e la',
		costsLink: 'pagina sulla privacy',
		costsAfter: 'spiega esattamente di che si tratta e come disattivarla.',
		whoTitle: 'Chi l’ha fatta',
		who1: 'L’ho costruita per mia figlia. Ha quasi otto anni e legge sia da sola sia con qualcuno accanto. L’idea è arrivata come arrivano quasi tutte quelle buone: parlando con altri genitori. Certi nostri amici ci hanno raccontato che tenevano traccia di quello che legge loro figlio, il mio figlioccio, con un’app semplice. Solo i libri e le pagine. Ed erano stupiti dai suoi progressi, da quanto legge un bambino quando la lettura si vede. Volevo la stessa cosa per lei, così l’ho costruita.',
		who2: 'È lei il motivo per cui la scala non può scendere, il motivo per cui non c’è nessuna serie da interrompere, e il motivo per cui non aver letto oggi non compare mai in rosso.',
		giveBefore: 'Se Coruja si guadagna un posto anche nella tua famiglia, la',
		giveLink: 'pagina Sostienici',
		giveAfter: 'racconta cosa aiuta di più. E se ti va di contribuire:'
	},
	privacy: {
		title: 'Privacy',
		metaDescription:
			'Il tuo scaffale vive in questo browser e in nessun altro posto. Nessun account, nessuna statistica, nessun tracciamento. L’unica eccezione: quando scansioni un libro, il suo ISBN viene inviato a un database di libri per recuperare il titolo e la copertina, e puoi disattivarla.',
		stays: 'Tutto quello che aggiungi resta in questo browser.',
		staysBody:
			'Lettori, libri, cosa è finito, quali badge sono stati conquistati: tutto viene scritto in un database dentro questo browser, su questo dispositivo, e niente viene inviato da nessuna parte. Non c’è nessun account, quindi non c’è niente su di te da conservare. Non ci sono statistiche, non c’è tracciamento, non c’è pubblicità, non c’è nessun servizio che raccoglie gli errori, nessuno script di terze parti e nessun carattere tipografico scaricato dal server di qualcun altro.',
		exceptionTitle: 'L’unica eccezione',
		exceptionBefore:
			'Quando scansioni un libro, il numero del suo codice a barre (il suo ISBN) viene inviato a',
		exceptionAfter:
			', il catalogo aperto di libri gestito da Internet Archive, l’organizzazione senza scopo di lucro. È così che titolo, autore e copertina arrivano senza che nessuno li scriva.',
		exception2:
			'Detto con chiarezza, cosa significa: dice a Open Library che qualcuno al tuo indirizzo ha cercato quel libro, in quel momento. Non parte nient’altro. Non chi lo sta leggendo, non cosa c’è già sul tuo scaffale, non un nome e non un identificatore. Non esiste nessun identificatore da inviare. Ma è una richiesta al server di qualcun altro, e questa è la descrizione onesta.',
		switchOffLead: 'Puoi disattivarla.',
		switchOffBody:
			'C’è un interruttore nelle Impostazioni, e con quello spento non parte nessuna richiesta. L’app resta perfettamente utilizzabile: titolo, autore e numero di pagine li scrivi tu, e un libro aggiunto così conta esattamente come tutti gli altri. Fa conquistare anche un badge.',
		googleOptIn:
			'C’è una seconda fonte che puoi scegliere di aggiungere: Google Books. È spenta finché non la accendi nelle Impostazioni. Con quella accesa, per un libro che Open Library non conosce — o conosce solo a metà — lo stesso numero viene inviato anche a Google per colmare le lacune. Non lo accompagna nient’altro, ma Google è un’azienda, non un ente senza scopo di lucro, ed è proprio questa differenza il motivo per cui è un interruttore separato invece che parte del primo.',
		covers:
			'Una copertina viene scaricata una volta sola e poi conservata nel database locale, così lo scaffale si disegna anche senza connessione e la stessa copertina non viene mai chiesta due volte. L’immagine stessa arriva dai server dell’Internet Archive, la stessa organizzazione senza scopo di lucro che gestisce Open Library.',
		backupsTitle: 'I tuoi backup sono tuoi',
		backupsBody:
			'Quando salvi una copia del tuo scaffale ottieni un file, e quel file va dove lo metti tu. Non viene caricato da nessuna parte e qui non ne resta nessuna copia. Questa è l’altra metà del patto: se niente sta su un server, niente si può recuperare da un server. Se cancelli i dati di questo browser, o se lo scaffale vive in una finestra privata che poi chiudi, è finita. Il file di backup è l’unica cosa che sopravvive a tutto questo, quindi creane uno.',
		hostingTitle: 'L’hosting, e come sappiamo che qualcuno la usa',
		hostingBody:
			'I file dell’app sono serviti da Cloudflare. Come ogni host, Cloudflare vede le richieste che scaricano quei file (la pagina, le icone, un aggiornamento) con l’indirizzo di rete da cui arrivano, e ci mostra conteggi aggregati. Questo è tutto il quadro che abbiamo su quanto viene usata: abbastanza per sapere che l’app è viva e più o meno quante persone la aprono, e niente di più. Nell’app non c’è nessuno script di statistiche, nessun cookie, nessun identificatore. E niente di quello che succede al suo interno, cosa c’è sul tuo scaffale o chi legge cosa, fa mai parte di una richiesta. La politica di sicurezza dell’app bloccherebbe uno script di tracciamento anche se ne venisse aggiunto uno per errore.',
		childrenTitle: 'I bambini',
		childrenBody:
			'Questa app è stata scritta perché la usi un bambino. Niente di quello che fa qui dentro viene raccolto, niente viene condiviso all’esterno, non c’è nessun feed, nessun profilo, nessun modo di pubblicare qualcosa e nessun modo per contattarlo attraverso l’app.',
		trademarks:
			'Cloudflare è un marchio di Cloudflare, Inc. Open Library e Internet Archive sono marchi di Internet Archive. Google Books è un marchio di Google LLC. Nessuno di loro è affiliato a Coruja; sono nominati perché essere precisi su chi vede cosa richiede di nominarli.'
	},
	support: {
		title: 'Sostienici',
		metaDescription: 'Coruja è gratuita. Ecco cosa aiuta davvero.',
		intro:
			'Coruja è gratuita, non ha nessun account e non mostra pubblicità. Non è una prova gratuita. È il punto. L’ha costruita un genitore nelle sere e nei fine settimana perché sua figlia leggesse di più, e perché leggere somigliasse a una scalata, non a un compito per casa.',
		helpsTitle: 'Cosa aiuta davvero',
		tellLead: 'Parlane a un’altra famiglia.',
		tellBody:
			'Un genitore il cui bambino sta appena iniziando a leggere da sé è esattamente la persona per cui è nata. Il passaparola è l’unica distribuzione che questa app ha.',
		addLead: 'Aggiungi un libro mancante a Open Library.',
		addBefore: 'Quando una scansione non trova niente, il libro è sconosciuto a',
		addAfter:
			', il catalogo aperto da cui Coruja legge. Lì chiunque può aggiungere o correggere una scheda, e ne beneficia ogni famiglia che userà Coruja dopo di te. (In ogni caso, aggiungerne uno nell’app fa conquistare il badge Catalogatore.)',
		sayLead: 'Dicci cosa non funziona o cosa manca.',
		sayBefore: 'Scrivi a',
		sayAfter:
			'. La versione che stai usando è mostrata in fondo alle Impostazioni. Includila, e «fa la cosa sbagliata» diventa una frase a cui si può rispondere.',
		giveTitle: 'Se vuoi ricambiare',
		give1:
			'Se Coruja aiuta tuo figlio a leggere di più, e se leggere diventa qualcosa di cui va fiero, quella è la ricompensa per cui questa app è stata costruita, e non ti costa niente. Davvero: qui non c’è niente da sbloccare, e non c’è nessun abbonamento nascosto dietro una prova gratuita.',
		give2:
			'Se si è guadagnata un posto nella tua famiglia e ti va di contribuire, il contributo serve a tenere in vita l’app: il dominio, sì, ma anche le sere e i fine settimana in cui viene costruita. E, come è giusto, un libro o due per la piccola lettrice per cui è nata.',
		contribute: 'Contribuisci con PayPal',
		trademark: 'PayPal è un marchio di PayPal, Inc., che non è affiliata a Coruja.'
	},
	errorPage: {
		notFound: 'Qui non c’è nessuna pagina. La civetta ha guardato.',
		other: 'Qualcosa è andato storto in questa pagina. Il tuo scaffale è intatto.',
		backHome: 'Torna allo scaffale'
	},
	ladder: {
		rungs: [
			'Nido',
			'Ramo',
			'Cima',
			'Tetto',
			'Campanile',
			'Collina',
			'Torre',
			'Montagna',
			'Vetta',
			'Nuvola',
			'Mongolfiera',
			'Aereo',
			'Razzo',
			'Satellite',
			'Luna',
			'Cometa',
			'Sole',
			'Stella',
			'Costellazione',
			'Galassia',
			'Cielo stellato'
		]
	}
};
