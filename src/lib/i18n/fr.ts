import type { Messages } from './messages.ts';

/**
 * French (international).
 *
 * Tutoiement throughout: the app speaks to a child about her own books, and "vous" would put a counter between her and the shelf. A parent reading over her shoulder is not the addressee.
 *
 * Kept free of regional vocabulary so it reads naturally in France, in Switzerland and in Belgium alike: nothing that assumes one country's schools or bookshops. "Badges" stays "badges": it is the word children actually use, and "insignes" is a uniform, not a game.
 */
export const fr: Messages = {
	nav: {
		scan: 'Scanner',
		shelf: 'Étagère',
		badges: 'Badges',
		setup: 'Réglages'
	},
	menu: { label: 'Menu', about: 'À propos', privacy: 'Confidentialité', support: 'Soutenir' },
	common: {
		loading: 'Chargement…',
		save: 'Enregistrer',
		cancel: 'Annuler',
		close: 'Fermer',
		edit: 'Modifier',
		delete: 'Supprimer',
		add: 'Ajouter',
		search: 'Rechercher',
		back: 'Retour',
		none: 'Aucun pour l’instant.',
		book: (count) => (count === 1 ? '1 livre' : `${count} livres`)
	},
	shelf: {
		title: 'Étagère',
		metaDescription: 'Tous les livres de la maison, et où tu en es sur l’échelle.',
		whoIsReading: 'Qui lit ?',
		ladderProgress: (finished) => `Barreau ${finished} sur 20`,
		ladderFull: 'Tout en haut de l’échelle, et ça continue !',
		booksFinished: (count) => (count === 1 ? '1 livre terminé' : `${count} livres terminés`),
		pagesRead: (count) => (count === 1 ? '1 page lue' : `${count.toLocaleString('fr')} pages lues`),
		readingNow: 'En cours de lecture',
		startPrompt: 'Choisis-en un sur l’étagère, ou scanne-en un nouveau.',
		empty: 'L’étagère est vide.',
		emptyHint: 'Scanne le premier livre, ou ajoutes-en un à la main.',
		searchPlaceholder: 'Titre ou auteur',
		filterAll: 'Tous',
		filterReading: 'En cours',
		filterFinished: 'Terminés',
		filterShelf: 'Sur l’étagère',
		allLanguages: 'Toutes les langues',
		sortLabel: 'Trier',
		sortRecentlyAdded: 'Ajoutés récemment',
		sortRecentlyRead: 'Lus récemment',
		sortTitle: 'Titre A–Z',
		noMatches: 'Rien ne correspond. Essaie avec moins de filtres.',
		byAuthor: (authors) => `de ${authors}`,
		pages: (n) => (n === 1 ? '1 page' : `${n} pages`),
		statusShelf: 'Sur l’étagère',
		statusReading: 'En cours',
		statusFinished: 'Terminé',
		startReading: 'Commencer la lecture',
		markFinished: 'Je l’ai fini !',
		readAgain: 'Le relire',
		readBefore: 'Marquer comme lu',
		readOnLabel: 'Terminé le',
		collectionsLabel: 'Collections',
		collectionsAll: 'Toutes les collections',
		collectionName: 'Nom',
		collectionEmoji: 'Émoji',
		collectionAdd: 'Nouvelle collection',
		collectionEdit: 'Modifier la collection',
		advanced: 'Plus de détails',
		collectionDeleteConfirm: (name: string) =>
			`Supprimer la collection « ${name} » ? Les livres restent sur l'étagère.`,
		unread: 'Pas encore fini, en fait',
		unreadConfirm: (title) =>
			`Marquer « ${title} » comme non terminé ? L’échelle se recompte. Les badges déjà gagnés restent gagnés.`,
		editBook: 'Modifier ce livre',
		adultBook: 'Livre pour adultes, masqué sur les profils des enfants',
		deleteBook: 'Supprimer ce livre',
		deleteConfirm: (title) =>
			`Supprimer « ${title} » ? Il quitte l’étagère avec son historique de lecture. Les badges déjà gagnés restent gagnés.`,
		addedByHand: 'ajouté à la main'
	},
	scan: {
		title: 'Scanner',
		metaDescription: 'Vise le code-barres et le livre se remplit tout seul.',
		prompt: 'Vise le code-barres au dos du livre.',
		manualEntry: 'Saisir le numéro à la place',
		isbnLabel: 'ISBN, le numéro sous le code-barres',
		isbnInvalid: 'Cela ne ressemble pas à un numéro de livre. Vérifie les chiffres.',
		cameraUnavailable: 'La caméra n’est pas disponible ici. Tu peux saisir le numéro à la place.',
		alreadyOnShelf: 'Celui-là est déjà sur ton étagère.',
		viewExisting: 'Montre-le-moi',
		addAnyway: 'Ajouter un deuxième exemplaire',
		scanning: 'Recherche d’un code-barres…',
		addManually: 'Ajouter un livre sans code-barres',
		titleLabel: 'Titre',
		authorLabel: 'Auteur',
		pagesLabel: 'Pages',
		publisherLabel: 'Éditeur',
		priceLabel: 'Prix',
		locationLabel: 'Emplacement',
		languageLabel: 'Langue du livre',
		added: (title) => `${title} est sur l’étagère !`,
		searchingMetadata: 'Recherche du titre et de la couverture…',
		offlineQueued:
			'Pas de connexion pour le moment. Le livre est enregistré, et les détails arriveront plus tard.'
	},
	badges: {
		title: 'Badges',
		metaDescription: 'Les badges que tu as gagnés, et ceux qui t’attendent.',
		earnedTitle: 'Gagnés',
		lockedTitle: 'Ils t’attendent',
		none: 'Aucun badge pour l’instant. Le premier est à un livre d’ici.',
		earnedOn: (date) => `Gagné le ${date}`,
		statsTitle: 'En chiffres',
		rereads: (count) => (count === 1 ? '1 livre relu' : `${count} livres relus`),
		familyTitle: 'Toute la famille',
		booksOnShelf: (count) =>
			count === 1 ? '1 livre sur l’étagère' : `${count} livres sur l’étagère`,
		ofShelfRead: 'de l’étagère lue',
		booksAMonth: 'livres par mois',
		pagesAMonth: 'pages par mois',
		finishedInYear: (year) => `terminés en ${year}`,
		longestBook: 'pages, ton plus long livre',
		labels: {
			'first-book': 'Premier livre',
			'five-books': 'Cinq livres',
			'ten-books': 'Dix livres',
			'twenty-books': 'Vingt livres',
			cataloguer: 'Catalogueur',
			doorstop: 'Pavé',
			'five-authors': 'Cinq auteurs',
			'two-tongues': 'Deux langues',
			polyglot: 'Polyglotte'
		},
		descriptions: {
			'first-book': 'Tu as fini un livre en entier.',
			'five-books': 'Cinq livres terminés. Ça fait déjà une petite pile !',
			'ten-books': 'Dix livres terminés. De quoi remplir ta propre étagère.',
			'twenty-books': 'Vingt livres terminés. Tout en haut de l’échelle !',
			cataloguer:
				'Tu as ajouté un livre dont internet n’avait jamais entendu parler. C’est toi qui l’as saisi, alors maintenant il existe.',
			doorstop: 'Tu as fini un livre de plus de quatre cents pages. Un gros !',
			'five-authors': 'Tu as fini des livres de cinq auteurs différents.',
			'two-tongues': 'Tu as fini des livres dans deux langues différentes.',
			polyglot:
				'Tu as fini des livres dans trois langues différentes. Le monde entier tient sur ton étagère.'
		}
	},
	setup: {
		title: 'Réglages',
		metaDescription: 'Lecteurs, langue, recherche de livres et sauvegarde.',

		readersTitle: 'Lecteurs',
		addReader: 'Ajouter un lecteur',
		readerName: 'Prénom',
		archiveReader: 'Archiver ce lecteur',
		renameReader: 'Modifier le nom et l’avatar',
		adultReader: 'Ce lecteur a 16 ans ou plus',

		languageTitle: 'Langue',
		followBrowser: (lang) => `Suivre mon appareil (${lang})`,

		lookupTitle: 'Recherche de livres',
		lookupExplain:
			'Quand tu scannes un livre, son numéro est envoyé à une base de données de livres pour récupérer le titre et la couverture. Cette requête est la seule chose qui quitte cet appareil.',
		lookupOn: 'Rechercher les livres pour moi',
		lookupOff: 'Désactivée. Je saisis les détails moi-même',

		backupTitle: 'Sauvegarde',
		backupExplain:
			'Ton étagère est enregistrée dans ce navigateur et nulle part ailleurs. Enregistre une copie de temps en temps, et garde-la dans un endroit où tu la retrouveras.',
		storageNotGuaranteed:
			'Le navigateur n’a pas promis de garder ces données pour toujours. Un fichier de sauvegarde est la vraie protection.',
		exportButton: 'Enregistrer une copie',
		importButton: 'Restaurer depuis une copie',
		importConfirm:
			'Cela remplace tout ce qui est sur l’étagère par le contenu du fichier. Enregistre d’abord une copie de ce que tu as si tu veux le garder.',
		importError: {
			'not-json': 'Ce fichier n’est pas une sauvegarde. Ce n’est pas le bon type de fichier.',
			'wrong-app': 'Cette sauvegarde appartient à une autre application.',
			'unsupported-version':
				'Cette sauvegarde vient d’une version de Coruja plus récente que celle-ci.',
			malformed: 'Cette sauvegarde est endommagée et n’a pas pu être lue.'
		},

		pinTitle: 'Code famille',
		pinExplain:
			'Avec un code, passer sur un profil adulte le demande. C’est ce qui garde les livres pour adultes à l’abri des doigts curieux. Un verrou d’enfant, pas un coffre-fort.',
		pinPlaceholder: '4 à 8 chiffres',
		pinSet: 'Définir le code',
		pinChange: 'Modifier',
		pinRemove: 'Retirer',
		pinCurrent: 'Code actuel',
		pinNew: 'Nouveau code',
		pinInvalid: 'Le code fait 4 à 8 chiffres.',
		pinWrong: 'Ce n’est pas le bon code.',
		pinPrompt: 'Code famille ?',
		aboutVersion: (version) => `Coruja ${version}`
	},
	about: {
		title: 'À propos de Coruja',
		metaDescription:
			'Coruja est un carnet de lecture familial et un inventaire de livres qui vit dans votre navigateur. Scannez un livre, il se remplit tout seul, et chaque livre terminé fait monter d’un barreau. Gratuit, sans compte, fonctionne hors ligne.',
		intro:
			'Coruja est un carnet de lecture et un inventaire de livres pour toute une famille, et il vit dans votre navigateur. Scannez le code-barres d’un livre et il se remplit tout seul : titre, auteur, couverture. Dites ensuite qui le lit. Quand quelqu’un termine un livre, il monte d’un barreau sur une échelle de vingt, et le livre reste ensuite sur l’étagère de la famille, parce que savoir ce que l’on possède compte tout autant.',
		introNote:
			'Rien à consigner, aucune minute à saisir, aucune page à compter. Un livre est sur l’étagère, en cours de lecture, ou terminé. C’est tout le système, et il est assez simple pour tenir dans la tête d’un enfant de sept ans.',
		nameTitle: 'Le nom, et la chouette',
		name1:
			'Coruja veut dire chouette en portugais, et la chouette a mérité ce poste trois fois. Les chouettes tiennent compagnie à la sagesse depuis qu’on les dessine : la petite chouette d’Athéna se perchait sur l’épaule du savoir lui-même, et l’oiseau se pose encore aujourd’hui sur les armoiries des bibliothèques et les ex-libris. Les chouettes sont aussi des créatures de la nuit, et c’est la nuit que se font les meilleures lectures, sous une lampe, une page ou deux après l’heure du coucher. C’est pour cela que l’application porte l’indigo : la couleur de l’heure où l’on raconte les histoires.',
		name2:
			'Mais si le nom est portugais, la raison est plus tendre que tout cela. Pai coruja et mãe coruja, père chouette et mère chouette, c’est ainsi que le portugais nomme le parent qui ne peut pas s’empêcher de raconter ce que son enfant vient de faire. Un parent chouette qui regarde grimper un petit lecteur : le nom contient déjà la raison d’être de l’application.',
		name3:
			'Le logo raconte la même histoire en trois traits. Deux cercles pour les grands yeux de la chouette, qui sont aussi des pages qui s’enroulent. En dessous, un livre ouvert, vu de face. Et toute la tête est penchée, parce que c’est le visage que l’on fait à tout âge quand on est curieux.',
		pronounce: 'Cela se prononce ko-ROU-ja, si vous vous posiez la question.',
		costsTitle: 'Ce que ça coûte, et ce que ça demande',
		costsBefore:
			'C’est gratuit. Il n’y a pas de compte, rien à créer et personne à prévenir. Tout ce que vous ajoutez est enregistré dans ce navigateur, sur cet appareil, et cela continue de fonctionner en mode avion. Un livre ajouté dans le train se remplit plus tard, tout seul. Une seule requête quitte l’appareil, et la',
		costsLink: 'page Confidentialité',
		costsAfter: 'dit exactement de quoi il s’agit et comment la désactiver.',
		whoTitle: 'Qui l’a faite',
		who1: 'J’ai construit ceci pour ma fille. Elle a presque huit ans et lit à la fois toute seule et avec quelqu’un à côté d’elle. L’idée est arrivée comme la plupart des bonnes : en parlant avec d’autres parents. Des amis nous ont raconté qu’ils suivaient les lectures de leur fils, mon filleul, avec une application simple. Juste les livres et les pages. Et ils étaient épatés par ses progrès, par tout ce qu’un enfant lit quand la lecture devient visible. Je voulais cela pour elle, alors je l’ai faite.',
		who2: 'Elle est la raison pour laquelle l’échelle ne peut pas descendre, la raison pour laquelle rien ne casse une série, et la raison pour laquelle ne pas lire aujourd’hui n’est jamais affiché en rouge.',
		giveBefore: 'Si Coruja gagne aussi une place dans votre famille, la',
		giveLink: 'page Soutenir',
		giveAfter: 'dit ce qui aide le plus. Et si vous avez envie de contribuer :'
	},
	privacy: {
		title: 'Confidentialité',
		metaDescription:
			'Votre étagère vit dans ce navigateur et nulle part ailleurs. Pas de compte, pas de statistiques, aucun pistage. La seule exception : scanner un livre envoie son ISBN à une base de livres pour récupérer le titre et la couverture, et vous pouvez la désactiver.',
		stays: 'Tout ce que vous ajoutez reste dans ce navigateur.',
		staysBody:
			'Les lecteurs, les livres, ce qui est terminé, les badges gagnés : tout cela est écrit dans une base de données à l’intérieur de ce navigateur, sur cet appareil, et rien n’est envoyé ailleurs. Il n’y a pas de compte, donc il n’y a rien à retenir sur vous. Il n’y a pas de statistiques, pas de pistage, pas de publicité, pas de service de rapport d’erreurs, aucun script tiers et aucune police récupérée sur le serveur de quelqu’un d’autre.',
		exceptionTitle: 'La seule exception',
		exceptionBefore:
			'Quand vous scannez un livre, le numéro de son code-barres (son ISBN) est envoyé à',
		exceptionAfter:
			', le catalogue de livres ouvert géré par l’organisation à but non lucratif Internet Archive. C’est ainsi que le titre, l’auteur et la couverture arrivent sans que personne les saisisse.',
		exception2:
			'Pour être clair sur ce que cela veut dire : Open Library apprend que quelqu’un, à votre adresse, a cherché ce livre, à ce moment-là. Rien d’autre ne part avec. Ni qui le lit, ni ce qui se trouve déjà sur votre étagère, ni un nom, ni un identifiant. Il n’y a aucun identifiant à envoyer. Mais c’est une requête vers le serveur de quelqu’un d’autre, et voilà la description honnête de la chose.',
		switchOffLead: 'Vous pouvez la désactiver.',
		switchOffBody:
			'Il y a un interrupteur dans les Réglages, et lorsqu’il est éteint aucune requête n’est faite du tout. L’application reste tout à fait utilisable : vous saisissez vous-même le titre, l’auteur et le nombre de pages, et un livre ajouté ainsi compte exactement comme les autres. Il fait même gagner un badge.',
		covers:
			'Une couverture est récupérée une fois puis conservée dans la base de données locale, si bien que l’étagère se dessine encore sans connexion et que la même couverture n’est jamais demandée deux fois. L’image elle-même vient des serveurs de l’Internet Archive, la même organisation à but non lucratif qui gère Open Library.',
		backupsTitle: 'Vos sauvegardes sont à vous',
		backupsBody:
			'Enregistrer une copie de votre étagère produit un fichier, et ce fichier va là où vous le mettez. Il n’est pas envoyé et il n’en existe aucune copie ici. C’est l’autre moitié du marché : comme rien n’est sur un serveur, rien ne peut être récupéré depuis un serveur. Si vous effacez les données de ce navigateur, ou si l’étagère vit dans une fenêtre privée que vous fermez, tout disparaît. Le fichier de sauvegarde est la seule chose qui survit à cela, alors faites-en un.',
		hostingTitle: 'L’hébergement, et comment nous savons que quelqu’un s’en sert',
		hostingBody:
			'Les fichiers de l’application sont servis par Cloudflare. Comme tout hébergeur, Cloudflare voit les requêtes qui récupèrent ces fichiers (la page, les icônes, une mise à jour) avec l’adresse réseau d’où elles viennent, et nous en montre des totaux agrégés. C’est là toute notre vision de l’usage : assez pour savoir que l’application est vivante et à peu près combien de personnes l’ouvrent, et rien de plus. Il n’y a aucun script de statistiques dans l’application, aucun cookie, aucun identifiant. Et rien de ce qui s’y passe, ce qui est sur votre étagère ou qui lit quoi, ne fait jamais partie d’une requête. La politique de sécurité de l’application bloquerait un script de pistage même si l’on en ajoutait un par erreur.',
		childrenTitle: 'Les enfants',
		childrenBody:
			'Ceci a été écrit pour qu’une enfant l’utilise. Rien de ce qu’elle y fait n’est collecté, rien n’est partagé vers l’extérieur, il n’y a pas de fil d’actualité, pas de profil, aucun moyen de publier quoi que ce soit et aucun moyen pour quiconque de la contacter par ce biais.',
		trademarks:
			'Cloudflare est une marque de Cloudflare, Inc. Open Library et Internet Archive sont des marques de l’Internet Archive. Ni l’une ni l’autre n’est affiliée à Coruja ; elles sont nommées parce qu’être exact sur qui voit quoi exige de les nommer.'
	},
	support: {
		title: 'Soutenir',
		metaDescription: 'Coruja est gratuit. Voici ce qui aide vraiment.',
		intro:
			'Coruja est gratuit, sans compte et sans publicité. Ce n’est pas une période d’essai. C’est le principe. Un parent l’a construite le soir et le week-end pour que sa fille lise davantage, et pour que lire ressemble à une ascension, pas à un devoir.',
		helpsTitle: 'Ce qui aide vraiment',
		tellLead: 'Parlez-en à une autre famille.',
		tellBody:
			'Un parent dont l’enfant commence tout juste à lire seul, c’est exactement pour lui que ceci existe. Le bouche-à-oreille est la seule diffusion de cette application.',
		addLead: 'Ajoutez un livre manquant à Open Library.',
		addBefore: 'Quand un scan ne donne rien, c’est que le livre est inconnu de',
		addAfter:
			', le catalogue ouvert que Coruja consulte. N’importe qui peut y ajouter ou y corriger une fiche, et toutes les familles qui utiliseront Coruja après vous en profitent. (L’ajouter à la main dans l’application fait gagner le badge Catalogueur dans tous les cas.)',
		sayLead: 'Dites ce qui ne va pas ou ce qui manque.',
		sayBefore: 'Écrivez à',
		sayAfter:
			'. La version que vous utilisez est affichée en bas des Réglages. Indiquez-la, et « ça fait n’importe quoi » devient une question à laquelle on peut répondre.',
		giveTitle: 'Si vous voulez donner quelque chose en retour',
		give1:
			'Si Coruja aide votre enfant à lire davantage, et si lire devient quelque chose dont elle est fière, c’est la récompense pour laquelle cette application a été construite, et cela ne vous coûte rien. Vraiment : rien ici ne se débloque, et aucun abonnement ne se cache derrière un essai gratuit.',
		give2:
			'Si elle a gagné une place dans votre famille et que vous avez envie de contribuer, cela sert à garder l’application en vie : le domaine, oui, mais aussi les soirées et les week-ends passés à la construire. Et, comme il se doit, un livre ou deux pour la petite lectrice pour qui elle a été faite.',
		contribute: 'Contribuer avec PayPal',
		trademark: 'PayPal est une marque de PayPal, Inc., qui n’est pas affiliée à Coruja.'
	},
	errorPage: {
		notFound: 'Il n’y a pas de page ici. La chouette a bien cherché.',
		other: 'Quelque chose s’est mal passé sur cette page. Ton étagère n’a pas bougé.',
		backHome: 'Retour à l’étagère'
	},
	ladder: {
		rungs: [
			'Nid',
			'Branche',
			'Cime',
			'Toit',
			'Clocher',
			'Colline',
			'Tour',
			'Montagne',
			'Sommet',
			'Nuage',
			'Montgolfière',
			'Avion',
			'Fusée',
			'Satellite',
			'Lune',
			'Comète',
			'Soleil',
			'Étoile',
			'Constellation',
			'Galaxie',
			'Ciel étoilé'
		]
	}
};
