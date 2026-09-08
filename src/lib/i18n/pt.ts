import type { Messages } from './messages.ts';

/**
 * European Portuguese (Portugal).
 *
 * The app arrives home in this catalogue: coruja is a Portuguese word before it is a product name, and pai coruja is the parent who cannot stop showing off what the child has done. Nothing here should read like a translation.
 *
 * Tratamento por tu, as any Portuguese adult would use with a child about her own books. Vocabulary from Lisbon rather than São Paulo: ecrã, câmara, foguetão, autocolante, algarismos, ficheiro, Definições. Grafia do Acordo Ortográfico de 1990, so atual and objeto lose the c they used to carry.
 *
 * "Medalhas" for the badges: distintivo belongs to a police officer and emblema to a football club, while a medalha is the thing a Portuguese child understands she has won. "Digitalizar" for the barcode, not "ler o código": in a reading app, ler is already spoken for, and a child should never wonder whether the app means the book or the number on its back.
 *
 * Aspas angulares «assim», closed tight without the spaces French insists on.
 */
export const pt: Messages = {
	nav: {
		scan: 'Digitalizar',
		shelf: 'Estante',
		badges: 'Medalhas',
		setup: 'Definições'
	},
	menu: { label: 'Menu', about: 'Sobre', privacy: 'Privacidade', support: 'Apoiar' },
	common: {
		loading: 'A carregar…',
		save: 'Guardar',
		cancel: 'Cancelar',
		close: 'Fechar',
		edit: 'Editar',
		delete: 'Eliminar',
		add: 'Adicionar',
		search: 'Pesquisar',
		back: 'Voltar',
		none: 'Ainda nenhum.',
		book: (count) => (count === 1 ? '1 livro' : `${count} livros`)
	},
	shelf: {
		title: 'Estante',
		metaDescription: 'Todos os livros que há em casa, e onde vais na escada.',
		whoIsReading: 'Quem está a ler?',
		ladderProgress: (finished) => `Degrau ${finished} de 20`,
		ladderFull: 'No topo da escada, e a contar!',
		booksFinished: (count) => (count === 1 ? '1 livro acabado' : `${count} livros acabados`),
		pagesRead: (count) =>
			count === 1 ? '1 página lida' : `${count.toLocaleString('pt-PT')} páginas lidas`,
		readingNow: 'A ler agora',
		startPrompt: 'Escolhe um da estante, ou digitaliza um novo.',
		empty: 'A estante está vazia.',
		emptyHint: 'Digitaliza o primeiro livro, ou adiciona um à mão.',
		searchPlaceholder: 'Título ou autor',
		filterAll: 'Todos',
		filterReading: 'A ler',
		filterFinished: 'Acabados',
		filterShelf: 'Na estante',
		allLanguages: 'Qualquer língua',
		sortLabel: 'Ordenar',
		sortRecentlyAdded: 'Adicionados há pouco',
		sortRecentlyRead: 'Lidos há pouco',
		sortTitle: 'Título A–Z',
		noMatches: 'Não há nada assim. Tenta com menos filtros.',
		byAuthor: (authors) => `de ${authors}`,
		pages: (n) => (n === 1 ? '1 página' : `${n} páginas`),
		statusShelf: 'Na estante',
		statusReading: 'A ler',
		statusFinished: 'Acabado',
		startReading: 'Começar a ler',
		markFinished: 'Já acabei!',
		readBefore: 'Marcar como lido',
		readOnLabel: 'Terminado em',
		collectionsLabel: 'Coleções',
		collectionsAll: 'Todas as coleções',
		collectionName: 'Nome',
		collectionEmoji: 'Emoji',
		collectionAdd: 'Nova coleção',
		collectionEdit: 'Editar coleção',
		advanced: 'Mais detalhes',
		collectionDeleteConfirm: (name: string) =>
			`Apagar a coleção «${name}»? Os livros ficam na estante.`,
		readAgain: 'Ler outra vez',
		unread: 'Afinal não acabei',
		unreadConfirm: (title) =>
			`Marcar «${title}» como não acabado? A escada volta a contar-se. As medalhas já ganhas continuam ganhas.`,
		editBook: 'Editar este livro',
		adultBook: 'Livro para adultos, escondido nos perfis das crianças',
		deleteBook: 'Eliminar este livro',
		deleteConfirm: (title) =>
			`Eliminar «${title}»? Sai da estante e leva com ele quem o leu. As medalhas já ganhas continuam ganhas.`,
		addedByHand: 'adicionado à mão'
	},
	scan: {
		title: 'Digitalizar',
		metaDescription: 'Aponta a câmara ao código de barras e o livro preenche-se sozinho.',
		prompt: 'Aponta a câmara ao código de barras na parte de trás do livro.',
		manualEntry: 'Escrever o número à mão',
		isbnLabel: 'ISBN, o número debaixo do código de barras',
		isbnInvalid: 'Isto não parece um número de livro. Vê outra vez os algarismos.',
		cameraUnavailable: 'A câmara não está disponível aqui. Podes escrever o número à mão.',
		alreadyOnShelf: 'Este já está na tua estante.',
		viewExisting: 'Mostra-me esse',
		addAnyway: 'Adicionar um segundo exemplar',
		scanning: 'À procura de um código de barras…',
		addManually: 'Adicionar um livro sem código de barras',
		titleLabel: 'Título',
		authorLabel: 'Autor',
		pagesLabel: 'Páginas',
		publisherLabel: 'Editora',
		priceLabel: 'Preço',
		locationLabel: 'Localização',
		languageLabel: 'Língua do livro',
		added: (title) => `${title} já está na estante!`,
		searchingMetadata: 'À procura do título e da capa…',
		offlineQueued:
			'Sem ligação neste momento. O livro fica guardado, e os detalhes chegam mais tarde.'
	},
	badges: {
		title: 'Medalhas',
		metaDescription: 'As medalhas que já ganhaste, e as que estão à tua espera.',
		earnedTitle: 'Ganhas',
		lockedTitle: 'À tua espera',
		none: 'Ainda não há medalhas. A primeira está a um livro de distância.',
		earnedOn: (date) => `Ganha em ${date}`,
		statsTitle: 'Em números',
		rereads: (count) =>
			count === 1 ? '1 livro lido outra vez' : `${count} livros lidos outra vez`,
		familyTitle: 'A família toda',
		booksOnShelf: (count) => (count === 1 ? '1 livro na estante' : `${count} livros na estante`),
		ofShelfRead: 'da estante já lida',
		booksAMonth: 'livros por mês',
		pagesAMonth: 'páginas por mês',
		finishedInYear: (year) => `acabados em ${year}`,
		longestBook: 'páginas, o teu livro mais longo',
		labels: {
			'first-book': 'Primeiro livro',
			'five-books': 'Cinco livros',
			'ten-books': 'Dez livros',
			'twenty-books': 'Vinte livros',
			cataloguer: 'Catalogador',
			doorstop: 'Calhamaço',
			'five-authors': 'Cinco autores',
			'two-tongues': 'Duas línguas',
			polyglot: 'Poliglota'
		},
		descriptions: {
			'first-book': 'Acabaste um livro do princípio ao fim.',
			'five-books': 'Cinco livros acabados. Já dá uma bela pilha!',
			'ten-books': 'Dez livros acabados. Dá para encher uma estante só tua.',
			'twenty-books': 'Vinte livros acabados. O topo da escada!',
			cataloguer:
				'Adicionaste um livro de que a internet nunca tinha ouvido falar. Foste tu que o escreveste, por isso agora ele existe.',
			doorstop: 'Acabaste um livro com mais de quatrocentas páginas. Um bem grande!',
			'five-authors': 'Acabaste livros de cinco autores diferentes.',
			'two-tongues': 'Acabaste livros em duas línguas diferentes.',
			polyglot: 'Acabaste livros em três línguas diferentes. O mundo inteiro cabe na tua estante.'
		}
	},
	setup: {
		title: 'Definições',
		metaDescription: 'Leitores, língua, pesquisa de livros e cópia de segurança.',

		readersTitle: 'Leitores',
		addReader: 'Adicionar um leitor',
		readerName: 'Nome',
		archiveReader: 'Arquivar este leitor',
		renameReader: 'Editar nome e avatar',
		adultReader: 'Este leitor tem 16 anos ou mais',

		languageTitle: 'Língua',
		followBrowser: (lang) => `Seguir o meu dispositivo (${lang})`,

		lookupTitle: 'Pesquisa de livros',
		lookupExplain:
			'Quando digitalizas um livro, o número dele é enviado para uma base de dados de livros para ir buscar o título e a capa. Esse pedido é a única coisa que sai deste dispositivo.',
		lookupOn: 'Procurar os livros por mim',
		lookupOff: 'Desligada. Escrevo eu os detalhes',
		googleLookup: 'Perguntar também ao Google Books quando o Open Library não chega',
		googleLookupExplain:
			'Ligado à partida, e és tu que o podes desligar. Quando o Open Library não conhece um livro, ou deixa detalhes em branco, o mesmo número é também enviado ao Google Books para preencher as falhas. A página de privacidade diz exatamente o que isso significa.',

		backupTitle: 'Cópia de segurança',
		backupExplain:
			'A tua estante está guardada neste navegador e em mais nenhum sítio. Guarda uma cópia de vez em quando, e deixa-a num lugar onde a voltes a encontrar.',
		storageNotGuaranteed:
			'O navegador não prometeu guardar estes dados para sempre. Um ficheiro de cópia de segurança é a verdadeira proteção.',
		exportButton: 'Guardar uma cópia',
		importButton: 'Restaurar a partir de uma cópia',
		importConfirm:
			'Isto substitui tudo o que está na estante pelo que está no ficheiro. Guarda primeiro uma cópia do que tens, se o quiseres manter.',
		importError: {
			'not-json': 'Esse ficheiro não é uma cópia de segurança. Não é o tipo de ficheiro certo.',
			'wrong-app': 'Essa cópia de segurança pertence a outra aplicação.',
			'unsupported-version':
				'Essa cópia de segurança vem de uma versão da Coruja mais recente do que esta.',
			malformed: 'Essa cópia de segurança está danificada e não foi possível lê-la.'
		},

		pinTitle: 'PIN da família',
		pinExplain:
			'Com um PIN definido, passar para um perfil de adulto pede-o. É isso que mantém os livros para adultos longe dos dedos curiosos. É um fecho para crianças, não um cofre.',
		pinPlaceholder: '4 a 8 algarismos',
		pinSet: 'Definir o PIN',
		pinChange: 'Alterar',
		pinRemove: 'Remover',
		pinCurrent: 'PIN atual',
		pinNew: 'PIN novo',
		pinInvalid: 'O PIN tem 4 a 8 algarismos.',
		pinWrong: 'Esse não é o PIN.',
		pinPrompt: 'PIN da família?',
		aboutVersion: (version) => `Coruja ${version}`
	},
	about: {
		title: 'Sobre a Coruja',
		metaDescription:
			'A Coruja é um registo de leituras e um inventário dos livros da família, e vive no teu navegador. Digitalizas um livro e ele preenche-se sozinho, e cada livro acabado sobe um degrau numa escada. Grátis, sem conta, funciona sem ligação.',
		intro:
			'A Coruja é um registo de leituras e um inventário dos livros de uma família, e vive no teu navegador. Digitaliza o código de barras de um livro e ele preenche-se sozinho: título, autor, capa. Depois dizes quem o está a ler. Quando alguém acaba um livro, sobe um degrau numa escada de vinte, e o livro fica na estante da família, porque saber o que há em casa acaba por ser metade do interesse.',
		introNote:
			'Não há nada para registar, nem minutos para escrever, nem páginas para contar. Um livro está na estante, a ser lido, ou acabado. É este o sistema todo, e é pequeno o suficiente para caber na cabeça de uma criança de sete anos.',
		nameTitle: 'O nome, e a coruja',
		name1:
			'A coruja mereceu este lugar por três razões. Faz companhia à sabedoria desde que há quem a desenhe: a corujinha de Atena pousava no ombro do próprio saber. A ave continua nos brasões das bibliotecas e nos ex-líbris de hoje. E é um bicho da noite, que é quando se lê melhor, debaixo de uma lâmpada, mais uma página depois da hora de dormir. É por isso que a aplicação se veste de índigo: a cor da hora a que se contam histórias.',
		name2:
			'Mas há uma razão mais quente do que essas todas: pai coruja e mãe coruja é exatamente para isso que a Coruja serve. Alguém pequeno a subir a escada, e alguém que não se consegue calar sobre isso. O nome já traz dentro dele a razão de a aplicação existir.',
		name3:
			'A marca conta a mesma história em três traços. Dois anéis para os olhos grandes da coruja, que são também páginas a enrolar. Debaixo deles, um livro aberto, visto de frente. E a cabeça está inclinada, porque é essa a cara que todos fazemos, em qualquer idade, quando temos curiosidade.',
		pronounce: 'Quem não fala português diz «ko-ROO-zha», e não fica longe.',
		costsTitle: 'Quanto custa, e o que pede em troca',
		costsBefore:
			'É grátis. Não há conta, não há nada para subscrever nem ninguém a quem dar contas. Tudo o que acrescentas fica guardado neste navegador, neste dispositivo, e continua a funcionar com o modo de avião ligado. Um livro acrescentado no comboio preenche-se mais tarde, sozinho. Um único pedido sai daqui, e a',
		costsLink: 'página da privacidade',
		costsAfter: 'diz exatamente o que é e como se desliga.',
		whoTitle: 'Quem fez isto',
		who1: 'Construí isto para a minha filha. Ela tem quase oito anos e lê sozinha e também acompanhada. A ideia apareceu como aparecem as melhores: a conversar com outros pais. Uns amigos nossos contaram-nos que registavam o que o filho lia, o meu afilhado, com uma aplicação simples. Só os livros e as páginas. E estavam maravilhados com o progresso dele, com o quanto uma criança lê quando a leitura está à vista. Eu queria isso para ela, e por isso fiz isto.',
		who2: 'É ela a razão de a escada nunca descer, a razão de parar uns dias não estragar nada, e a razão de um dia sem ler nunca aparecer a vermelho.',
		giveBefore: 'Se a Coruja também ganhar um lugar na tua família, a',
		giveLink: 'página de apoio',
		giveAfter: 'diz o que ajuda mais. E se te apetecer contribuir:'
	},
	privacy: {
		title: 'Privacidade',
		metaDescription:
			'A tua estante vive neste navegador e em mais nenhum sítio. Sem conta, sem análises, sem rastreio. A única exceção: digitalizar um livro envia o ISBN dele para uma base de dados de livros, para ir buscar o título e a capa, e isso pode ser desligado.',
		stays: 'Tudo o que acrescentas fica neste navegador.',
		staysBody:
			'Leitores, livros, o que está acabado, as medalhas que foram ganhas: está tudo escrito numa base de dados dentro deste navegador, neste dispositivo, e nada disso é enviado para sítio nenhum. Não há conta, por isso não há nada sobre ti para guardar. Não há análises, não há rastreio, não há publicidade, não há serviço de relatório de erros, não há script de terceiros nem um tipo de letra que venha do servidor de outra pessoa.',
		exceptionTitle: 'A única exceção',
		exceptionBefore:
			'Quando digitalizas um livro, o número do código de barras dele (o ISBN) é enviado para a',
		exceptionAfter:
			', a biblioteca aberta que o Internet Archive, uma organização sem fins lucrativos, mantém. É assim que o título, o autor e a capa aparecem sem ninguém os escrever.',
		exception2:
			'Sendo claro sobre o que isso quer dizer: fica a saber-se, na Open Library, que alguém no teu endereço procurou aquele livro, naquele momento. Mais nada vai com o pedido. Não vai quem o está a ler, nem o que já está na tua estante, nem um nome, nem um identificador. Não há identificador nenhum para enviar. Mas é um pedido ao servidor de outra pessoa, e esta é a descrição honesta disso.',
		switchOffLead: 'Podes desligar a pesquisa.',
		switchOffBody:
			'Há um interruptor nas Definições e, com ele desligado, não é feito pedido nenhum. A aplicação continua completamente utilizável: escreves tu o título, o autor e o número de páginas, e um livro acrescentado assim conta exatamente o mesmo que qualquer outro. Até dá uma medalha.',
		googleOptIn:
			'Uma segunda fonte ajuda com os livros que o Open Library mal conhece: o Google Books. Quando o Open Library não conhece um livro — ou conhece só a meias — o mesmo número é enviado também à Google para preencher as falhas. Nada mais vai com ele, mas a Google é uma empresa, não uma organização sem fins lucrativos, e é por isso que tem o seu próprio interruptor nas Definições, separado do primeiro.',
		covers:
			'Uma capa é buscada uma vez e fica depois guardada na base de dados local, para que a estante continue a desenhar-se sem ligação e a mesma capa nunca seja pedida duas vezes. A própria imagem vem dos servidores do Internet Archive, a mesma organização sem fins lucrativos que gere a Open Library.',
		backupsTitle: 'As tuas cópias de segurança são tuas',
		backupsBody:
			'Guardar uma cópia da tua estante produz um ficheiro, e esse ficheiro vai para onde tu o puseres. Não é enviado para nenhum sítio e não fica aqui cópia nenhuma dele. É a outra metade do acordo: como nada está num servidor, também nada pode ser recuperado de um. Se limpares os dados deste navegador, ou se a estante viver numa janela privada que depois fechas, desaparece. O ficheiro da cópia de segurança é a única coisa que sobrevive a isso, por isso faz um.',
		hostingTitle: 'Alojamento, e como sabemos que alguém usa isto',
		hostingBody:
			'Os ficheiros da aplicação são servidos pela Cloudflare. Como qualquer alojamento, a Cloudflare vê os pedidos que vão buscar esses ficheiros (a página, os ícones, uma atualização) com o endereço de rede de onde vieram, e mostra-nos contagens agregadas deles. É esse o nosso retrato inteiro da utilização: o suficiente para saber que a aplicação está viva e mais ou menos quantas pessoas a abrem, e nada mais. Não há script de análise na aplicação, não há cookie, não há identificador. E nada do que se passa lá dentro, o que está na tua estante ou quem lê o quê, faz parte de pedido nenhum. A política de segurança da própria aplicação bloquearia um script de rastreio mesmo que algum fosse acrescentado por engano.',
		childrenTitle: 'Crianças',
		childrenBody:
			'Isto foi escrito para ser usado por uma criança. Nada do que ela faz aqui é recolhido, nada é partilhado para fora, não há feed, não há perfil, não há maneira de publicar nada nem maneira de alguém a contactar através disto.',
		trademarks:
			'Cloudflare é uma marca registada da Cloudflare, Inc. Open Library e Internet Archive são marcas registadas do Internet Archive. Google Books é uma marca registada da Google LLC. Nenhum deles está associado à Coruja; são nomeados porque ser exato sobre quem vê o quê obriga a nomeá-los.'
	},
	support: {
		title: 'Apoiar',
		metaDescription: 'A Coruja é grátis. Aqui fica o que realmente ajuda.',
		intro:
			'A Coruja é grátis, não tem conta e não mostra publicidade. Isto não é uma versão de experiência. É a ideia toda. Foi um pai que a construiu ao serão e aos fins de semana, para que a filha lesse mais e para que ler fosse como subir, e não trabalhos para casa.',
		helpsTitle: 'O que realmente ajuda',
		tellLead: 'Fala disto a outra família.',
		tellBody:
			'Um pai ou uma mãe cujo filho está a começar a ler sozinho é exatamente quem isto serve. O boca a boca é a única distribuição que esta aplicação tem.',
		addLead: 'Acrescenta à Open Library um livro que falte.',
		addBefore: 'Quando uma digitalização não dá nada, o livro é desconhecido para a',
		addAfter:
			', a biblioteca aberta de onde a Coruja lê. Qualquer pessoa pode acrescentar ou corrigir um registo lá, e todas as famílias que usarem a Coruja depois de ti ficam a ganhar. (Acrescentá-lo à mão na aplicação dá a medalha de Catalogador de qualquer maneira.)',
		sayLead: 'Diz o que está mal ou o que falta.',
		sayBefore: 'Escreve para',
		sayAfter:
			'. A versão que estás a usar aparece no fim das Definições. Inclui-a, e «faz a coisa errada» passa a ter resposta.',
		giveTitle: 'Se quiseres retribuir',
		give1:
			'Se a Coruja ajudar a tua filha ou o teu filho a ler mais, e se ler passar a ser motivo de orgulho, é essa a recompensa para que esta aplicação foi feita, e não te custa nada. A sério: aqui não se desbloqueia nada, e não há subscrição escondida atrás de um período grátis.',
		give2:
			'Se ela ganhou um lugar na tua família e te apetecer contribuir, isso vai para manter a aplicação viva: o domínio, sim, mas também os serões e os fins de semana em que é feita. E, como é devido, um livro ou dois para a pequena leitora para quem foi feita.',
		contribute: 'Contribuir com PayPal',
		trademark: 'PayPal é uma marca registada da PayPal, Inc., que não está associada à Coruja.'
	},
	errorPage: {
		notFound: 'Aqui não há página nenhuma. A coruja já procurou.',
		other: 'Algo correu mal nesta página. A tua estante está intacta.',
		backHome: 'Voltar à estante'
	},
	ladder: {
		rungs: [
			'Ninho',
			'Ramo',
			'Copa',
			'Telhado',
			'Campanário',
			'Colina',
			'Torre',
			'Montanha',
			'Cume',
			'Nuvem',
			'Balão',
			'Avião',
			'Foguetão',
			'Satélite',
			'Lua',
			'Cometa',
			'Sol',
			'Estrela',
			'Constelação',
			'Galáxia',
			'Céu estrelado'
		]
	}
};
