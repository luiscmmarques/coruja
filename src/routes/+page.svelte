<script lang="ts">
	/**
	 * Home: the shelf. There is no separate "Today" — the reader's ladder and open books sit at the top of the inventory, because for a books app the shelf is the app.
	 */
	import BadgeToken from '$lib/BadgeToken.svelte';
	import CoverImage from '$lib/CoverImage.svelte';
	import {
		booksStore,
		collectionsStore,
		deleteBook,
		earnedBadgesStore,
		editBook,
		finishReading,
		readersStore,
		readingsStore,
		settingsStore,
		recordPastRead,
		startReading,
		undoLatestReading,
		addReader
	} from '$lib/db';
	import {
		bookStatus,
		READER_EMOJI,
		type Book,
		type BookStatus,
		type Collection,
		type EarnedBadge
	} from '$lib/domain/types';
	import CollectionPicker from '$lib/CollectionPicker.svelte';
	import { ladderPosition, LADDER_SIZE } from '$lib/domain/ladder';
	import { pagesRead } from '$lib/domain/stats';
	import { t } from '$lib/i18n';
	import { locale } from '$lib/locale';

	const readers = $derived(($readersStore ?? []).filter((r) => !r.archived));
	const activeReader = $derived(
		readers.find((r) => r.id === $settingsStore?.activeReaderId) ?? readers[0]
	);
	const readings = $derived($readingsStore ?? []);
	/*
	 * Adult-marked books are absent for a child, not labelled: from the list, the
	 * search, the counts and the language chips alike, because all of them derive from
	 * this one filter. A label would be an invitation.
	 */
	const books = $derived(
		($booksStore ?? []).filter((b) => !b.archived && (!b.adult || activeReader?.adult === true))
	);

	const ladder = $derived(activeReader ? ladderPosition(readings, activeReader.id) : undefined);
	const readerPages = $derived(activeReader ? pagesRead(readings, books, activeReader.id) : 0);

	// --- first-run: add the first reader inline, without a trip to Setup ---
	let newName = $state('');
	let newEmoji = $state(READER_EMOJI[0]);
	let newAdult = $state(false);

	async function createReader(event: SubmitEvent) {
		event.preventDefault();
		if (!newName.trim()) return;
		await addReader(newName, newEmoji, 'var(--accent)', newAdult);
		newName = '';
		newAdult = false;
	}

	// --- shelf list ---
	let query = $state('');
	let filter = $state<'all' | BookStatus>('all');
	const collections = $derived(
		($collectionsStore ?? []).toSorted((a, b) => a.name.localeCompare(b.name))
	);
	let collectionFilter = $state<string>('all');
	let languageFilter = $state<string>('all');
	let sortBy = $state<'added' | 'read' | 'title'>('added');

	/*
	 * The languages actually on the shelf, for the filter chips. Derived rather than configured: a bilingual household sees two chips, a monolingual one sees none at all - a filter with one option is furniture.
	 */
	const shelfLanguages = $derived(
		[...new Set(books.map((b) => b.language).filter((l): l is string => Boolean(l)))].toSorted()
	);

	/* 'fr' as «français» or "French" depending on the UI language, with no catalogue
	 * entry per language - the browser already knows every language name. */
	function languageName(code: string): string {
		try {
			return new Intl.DisplayNames([$locale], { type: 'language' }).of(code) ?? code;
		} catch {
			return code;
		}
	}

	function statusOf(book: Book): BookStatus {
		return activeReader ? bookStatus(readings, book.id, activeReader.id) : 'shelf';
	}

	/*
	 * What the OTHER readers are doing with this book — the family half of a shared shelf: in a parent's profile, a book the child has open should not look idle. A fact about the household's books, not a comparison between its readers: no counts, no ordering, just “she is reading this one” (guardrail #4 intact).
	 */
	function othersOn(book: Book): Array<{ emoji: string; name: string; status: BookStatus }> {
		return readers
			.filter((r) => r.id !== activeReader?.id)
			.map((r) => ({ emoji: r.emoji, name: r.name, status: bookStatus(readings, book.id, r.id) }))
			.filter((entry) => entry.status !== 'shelf');
	}

	const visibleBooks = $derived(
		books
			.filter((book) => {
				if (filter !== 'all' && statusOf(book) !== filter) return false;
				if (languageFilter !== 'all' && book.language !== languageFilter) return false;
				if (collectionFilter !== 'all' && !(book.collectionIds ?? []).includes(collectionFilter))
					return false;
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return (
					book.title.toLowerCase().includes(q) ||
					book.authors.some((a) => a.toLowerCase().includes(q)) ||
					(book.publisher?.toLowerCase().includes(q) ?? false) ||
					(book.shelfLocation?.toLowerCase().includes(q) ?? false) ||
					collections.some(
						(c) => (book.collectionIds ?? []).includes(c.id) && c.name.toLowerCase().includes(q)
					)
				);
			})
			.toSorted(byCurrentSort)
	);

	/*
	 * The active reader's latest touch on each book — a finish beats its start because it is later. Books this reader never opened sort after all touched ones under “recently read”, newest-bought first, which reads as “my pile, then the shop”.
	 */
	const lastRead = $derived.by(() => {
		const latest = new Map<string, string>();
		if (!activeReader) return latest;
		for (const r of readings) {
			if (r.readerId !== activeReader.id) continue;
			const touch = r.finishedAt ?? r.startedAt;
			const known = latest.get(r.bookId);
			if (!known || touch > known) latest.set(r.bookId, touch);
		}
		return latest;
	});

	function byCurrentSort(a: Book, b: Book): number {
		if (sortBy === 'title') return a.title.localeCompare(b.title, $locale);
		if (sortBy === 'read') {
			const ta = lastRead.get(a.id) ?? '';
			const tb = lastRead.get(b.id) ?? '';
			if (ta !== tb) return tb.localeCompare(ta);
		}
		return b.addedAt.localeCompare(a.addedAt);
	}

	const readingNow = $derived(books.filter((book) => statusOf(book) === 'reading'));

	$effect(() => {
		if (collectionFilter !== 'all' && !collections.some((c) => c.id === collectionFilter)) {
			collectionFilter = 'all';
		}
		if (languageFilter !== 'all' && !shelfLanguages.includes(languageFilter)) {
			languageFilter = 'all';
		}
	});

	const filterOptions = $derived<Array<{ value: 'all' | BookStatus; label: string }>>([
		{ value: 'all', label: $t.shelf.filterAll },
		{ value: 'reading', label: $t.shelf.filterReading },
		{ value: 'finished', label: $t.shelf.filterFinished },
		{ value: 'shelf', label: $t.shelf.filterShelf }
	]);

	// --- actions ---
	let celebration = $state<EarnedBadge[]>([]);

	async function finish(book: Book) {
		if (!activeReader) return;
		const earned = await finishReading(book.id, activeReader.id, (badgeId) => ({
			label: $t.badges.labels[badgeId] ?? badgeId
		}));
		if (earned.length > 0) celebration = earned;
	}

	async function start(book: Book) {
		if (!activeReader) return;
		await startReading(book.id, activeReader.id);
	}

	/** Toggle `book`'s membership of a collection, from either variant of the picker. */
	async function toggleBookCollection(book: Book, id: string) {
		const current = book.collectionIds ?? [];
		const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
		await editBook(book.id, { collectionIds: next.length > 0 ? next : undefined });
	}

	function toggleCollection(id: string) {
		editCollectionIds = editCollectionIds.includes(id)
			? editCollectionIds.filter((x) => x !== id)
			: [...editCollectionIds, id];
	}

	/** A book read before the app existed: dated finish, honest badges, dialog closes. */
	async function markReadBefore() {
		if (!editing || !activeReader || !readOnDate) return;
		const earned = await recordPastRead(editing.id, activeReader.id, readOnDate, (badgeId) => ({
			label: $t.badges.labels[badgeId] ?? badgeId
		}));
		if (earned.length > 0) celebration = earned;
		editing = null;
	}

	async function unread(book: Book) {
		if (!activeReader) return;
		if (!confirm($t.shelf.unreadConfirm(book.title))) return;
		await undoLatestReading(book.id, activeReader.id);
	}

	// --- edit dialog ---
	let editing = $state<Book | null>(null);
	let editTitle = $state('');
	let editAuthors = $state('');
	let editPublisher = $state('');
	let editPages = $state('');
	let editLanguage = $state('');
	let editPrice = $state('');
	let editLocation = $state('');
	let editAdult = $state(false);
	let readOnDate = $state(new Date().toISOString().slice(0, 10));
	let editCollectionIds = $state<string[]>([]);

	function openEdit(book: Book) {
		editing = book;
		editTitle = book.title;
		editAuthors = book.authors.join(', ');
		editPublisher = book.publisher ?? '';
		editPages = book.pageCount ? String(book.pageCount) : '';
		editLanguage = book.language ?? '';
		editPrice = book.purchasePrice !== undefined ? String(book.purchasePrice) : '';
		editLocation = book.shelfLocation ?? '';
		editCollectionIds = [...(book.collectionIds ?? [])];
		editAdult = book.adult === true;
	}

	/** Comma decimals are what half this app's languages type; both forms parse. */
	function parsePrice(raw: string): number | undefined {
		if (raw.trim() === '') return undefined;
		const n = Number.parseFloat(raw.replace(',', '.'));
		return Number.isFinite(n) && n >= 0 ? n : undefined;
	}

	async function saveEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!editing || !editTitle.trim()) return;
		const pages = Number.parseInt(editPages, 10);
		await editBook(editing.id, {
			title: editTitle.trim(),
			authors: editAuthors
				.split(',')
				.map((a) => a.trim())
				.filter(Boolean),
			publisher: editPublisher.trim() || undefined,
			// Stored as a lowercased base tag ('fr'), which is what Two Tongues compares.
			language: editLanguage.trim().toLowerCase().split('-')[0] || undefined,
			pageCount: Number.isFinite(pages) && pages > 0 ? pages : undefined,
			purchasePrice: parsePrice(editPrice),
			shelfLocation: editLocation.trim() || undefined,
			// $state arrays are Proxies, and IndexedDB's structured clone refuses a
			// Proxy (DataCloneError). Snapshot at the persistence boundary.
			collectionIds: editCollectionIds.length > 0 ? $state.snapshot(editCollectionIds) : undefined,
			// Only an adult profile sees the checkbox; a child's edit must not clear it.
			...(activeReader?.adult === true ? { adult: editAdult || undefined } : {})
		});
		editing = null;
	}

	async function removeBook() {
		if (!editing) return;
		if (!confirm($t.shelf.deleteConfirm(editing.title))) return;
		await deleteBook(editing.id);
		editing = null;
	}
</script>

<svelte:head>
	<title>{$t.shelf.title} · coruja</title>
	<meta name="description" content={$t.shelf.metaDescription} />
</svelte:head>

{#if $readersStore === undefined}
	<p class="muted">{$t.common.loading}</p>
{:else if readers.length === 0}
	<!-- First run: one question, then straight to scanning. -->
	<section class="card">
		<h1>{$t.shelf.whoIsReading}</h1>
		<form onsubmit={createReader}>
			<input
				type="text"
				name="reader-name"
				autocomplete="off"
				bind:value={newName}
				placeholder={$t.setup.readerName}
				required
			/>
			<div class="emoji-row" role="radiogroup" aria-label="avatar">
				{#each READER_EMOJI as emoji (emoji)}
					<button
						type="button"
						class="quiet emoji-pick"
						class:picked={newEmoji === emoji}
						onclick={() => (newEmoji = emoji)}
					>
						{emoji}
					</button>
				{/each}
			</div>
			<label class="adult">
				<input type="checkbox" name="reader-adult" bind:checked={newAdult} />
				{$t.setup.adultReader}
			</label>
			<button type="submit" class="primary">{$t.setup.addReader}</button>
		</form>
	</section>
{:else}
	{#if celebration.length > 0}
		<section class="card celebration" aria-live="polite">
			{#each celebration as badge (badge.id)}
				<div class="earned">
					<BadgeToken emoji={badge.emoji} size={48} />
					<strong
						>{($t.badges.labels as Record<string, string>)[badge.badgeId] ?? badge.label}</strong
					>
				</div>
			{/each}
			<button class="quiet" onclick={() => (celebration = [])}>{$t.common.close}</button>
		</section>
	{/if}

	<section class="top">
		{#if ladder && activeReader}
			<a class="ladder card" href="/badges">
				<BadgeToken emoji={ladder.emoji} size={56} />
				<div class="ladder-body">
					<strong>{$t.ladder.rungs[ladder.rung]}</strong>
					<p class="muted">
						{ladder.isFull ? $t.shelf.ladderFull : $t.shelf.ladderProgress(ladder.rung)}
						· {$t.shelf.booksFinished(ladder.finished)}{#if readerPages > 0}
							· {$t.shelf.pagesRead(readerPages)}{/if}
					</p>
					<!-- The rungs, countable at a glance; the text above already says the number. -->
					<div class="rungs" aria-hidden="true">
						{#each { length: 20 } as _, i (i)}
							<span class="rung" class:done={i < ladder.finished}></span>
						{/each}
					</div>
				</div>
			</a>
		{/if}
	</section>

	{#if readingNow.length > 0}
		<section>
			<h2>{$t.shelf.readingNow} <span class="count">{readingNow.length}</span></h2>
			{#each readingNow as book (book.id)}
				<article class="book card">
					<span class="cover"><CoverImage coverId={book.coverId} title={book.title} /></span>
					<div class="detail">
						<strong>{book.title}</strong>
						{#if book.authors.length}<p class="muted">
								{$t.shelf.byAuthor(book.authors.join(', '))}
							</p>{/if}
					</div>
					<div class="actions">
						<button class="primary" onclick={() => finish(book)}>{$t.shelf.markFinished}</button>
					</div>
				</article>
			{/each}
		</section>
	{/if}

	<section>
		<h2>{$t.shelf.title} <span class="count">{$t.common.book(books.length)}</span></h2>
		{#if books.length === 0}
			<p>{$t.shelf.empty}</p>
			<p class="muted">{$t.shelf.emptyHint}</p>
		{:else}
			<input
				type="search"
				name="shelf-search"
				bind:value={query}
				placeholder={$t.shelf.searchPlaceholder}
			/>
			<div class="filters" role="radiogroup" aria-label={$t.shelf.title}>
				{#each filterOptions as option (option.value)}
					<button
						class="quiet chip"
						class:active={filter === option.value}
						onclick={() => (filter = option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<div class="controls">
				{#if shelfLanguages.length > 1}
					<!-- Its first option names what it filters, so the closed control explains itself. -->
					<select
						name="language-filter"
						aria-label={$t.scan.languageLabel}
						bind:value={languageFilter}
					>
						<option value="all">{$t.shelf.allLanguages}</option>
						{#each shelfLanguages as lang (lang)}
							<option value={lang}>{languageName(lang)}</option>
						{/each}
					</select>
				{/if}
				{#if collections.length > 0}
					<select
						name="collection-filter"
						aria-label={$t.shelf.collectionsLabel}
						bind:value={collectionFilter}
					>
						<option value="all">{$t.shelf.collectionsAll}</option>
						{#each collections as collection (collection.id)}
							<option value={collection.id}>{collection.emoji} {collection.name}</option>
						{/each}
					</select>
				{/if}
				<select name="shelf-sort" aria-label={$t.shelf.sortLabel} bind:value={sortBy}>
					<option value="added">{$t.shelf.sortRecentlyAdded}</option>
					<option value="read">{$t.shelf.sortRecentlyRead}</option>
					<option value="title">{$t.shelf.sortTitle}</option>
				</select>
			</div>

			{#if visibleBooks.length === 0}
				<p class="muted">{$t.shelf.noMatches}</p>
			{/if}

			{#each visibleBooks as book (book.id)}
				{@const status = statusOf(book)}
				<article class="book card">
					<span class="cover"><CoverImage coverId={book.coverId} title={book.title} /></span>
					<div class="detail">
						<strong>{book.title}</strong>
						{#if book.authors.length}<p class="muted">
								{$t.shelf.byAuthor(book.authors.join(', '))}
							</p>{/if}
						<p class="muted">
							{#if status === 'finished'}<span class="status-finished"
									>{$t.shelf.statusFinished}</span
								>
							{:else if status === 'reading'}<span class="status-reading"
									>{$t.shelf.statusReading}</span
								>
							{:else}{$t.shelf.statusShelf}{/if}
							{#if book.pageCount}· {$t.shelf.pages(book.pageCount)}{/if}
							{#if book.publishedYear}· {book.publishedYear}{/if}
							{#if book.publisher}· {book.publisher}{/if}
							{#if book.shelfLocation}· 📍 {book.shelfLocation}{/if}
							{#each collections.filter( (c) => (book.collectionIds ?? []).includes(c.id) ) as c (c.id)}
								<span title={c.name}>{c.emoji}</span>
							{/each}
							{#if book.source === 'manual' && !book.isbn13}· <span class="gold"
									>{$t.shelf.addedByHand}</span
								>{/if}
						</p>
						{#if othersOn(book).length > 0}
							<!-- The rest of the family, one compact row: a fact about the household's
							     book, never a comparison between its readers. -->
							<p class="family">
								{#each othersOn(book) as other (other.name)}
									<span
										class="pill"
										class:finished={other.status === 'finished'}
										title={other.status === 'finished'
											? $t.shelf.statusFinished
											: $t.shelf.statusReading}
									>
										<span aria-hidden="true">{other.emoji}</span>
										{other.name}
										<span class="glyph" aria-hidden="true"
											>{other.status === 'finished' ? '✓' : '…'}</span
										>
										<span class="visually-hidden"
											>{other.status === 'finished'
												? $t.shelf.statusFinished
												: $t.shelf.statusReading}</span
										>
									</span>
								{/each}
							</p>
						{/if}
					</div>
					<div class="actions">
						{#if status === 'shelf'}
							<button class="outline" onclick={() => start(book)}>{$t.shelf.startReading}</button>
						{:else if status === 'reading'}
							<button class="primary" onclick={() => finish(book)}>{$t.shelf.markFinished}</button>
						{:else}
							<button class="outline" onclick={() => start(book)}>{$t.shelf.readAgain}</button>
						{/if}
						{#if collections.length > 0}
							<CollectionPicker
								{collections}
								selectedIds={book.collectionIds ?? []}
								onToggle={(id) => toggleBookCollection(book, id)}
								label={$t.shelf.collectionsLabel}
							/>
						{/if}
						<button class="icon" aria-label={$t.shelf.editBook} onclick={() => openEdit(book)}
							><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"
								><path
									d="M13.6 3.2l3.2 3.2L7 16.2l-3.9.7.7-3.9z"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linejoin="round"
								/></svg
							></button
						>
					</div>
				</article>
			{/each}
		{/if}
	</section>

	{#if editing}
		<div class="overlay" role="dialog" aria-modal="true" aria-label={$t.shelf.editBook}>
			<form class="card" onsubmit={saveEdit}>
				<h2>{$t.shelf.editBook}</h2>
				<label
					>{$t.scan.titleLabel}<input
						type="text"
						name="book-title"
						autocomplete="off"
						bind:value={editTitle}
						required
					/></label
				>
				<label
					>{$t.scan.authorLabel}<input
						type="text"
						name="book-authors"
						autocomplete="off"
						bind:value={editAuthors}
					/></label
				>
				<label
					>{$t.scan.pagesLabel}<input
						type="number"
						name="book-pages"
						min="1"
						bind:value={editPages}
					/></label
				>
				{#if collections.length > 0}
					<label class="collections-label"
						>{$t.shelf.collectionsLabel}<CollectionPicker
							{collections}
							selectedIds={editCollectionIds}
							onToggle={toggleCollection}
							label={$t.shelf.collectionsLabel}
							variant="full"
						/></label
					>
				{/if}
				{#if statusOf(editing) === 'shelf'}
					<!-- Cataloguing the past: the family's pre-app reading deserves to count,
					     in the year it actually happened. -->
					<div class="read-before">
						<label
							>{$t.shelf.readOnLabel}<input
								type="date"
								name="read-on"
								max={new Date().toISOString().slice(0, 10)}
								bind:value={readOnDate}
							/></label
						>
						<button type="button" class="outline" onclick={markReadBefore}>
							{$t.shelf.readBefore}
						</button>
					</div>
				{/if}
				<!-- The drawer keeps the everyday dialog short; nothing here is needed to
				     rename a book or file it in a collection. Native details: no JS, free
				     keyboard and screen-reader semantics. -->
				<details class="advanced">
					<summary>{$t.shelf.advanced}</summary>
					<div class="advanced-fields">
						<label
							>{$t.scan.publisherLabel}<input
								type="text"
								name="book-publisher"
								autocomplete="off"
								bind:value={editPublisher}
							/></label
						>
						<label
							>{$t.scan.priceLabel}<input
								type="text"
								name="book-price"
								inputmode="decimal"
								autocomplete="off"
								bind:value={editPrice}
							/></label
						>
						<label
							>{$t.scan.locationLabel}<input
								type="text"
								name="book-location"
								autocomplete="off"
								bind:value={editLocation}
							/></label
						>
						<label
							>{$t.scan.languageLabel}<input
								type="text"
								name="book-language"
								autocomplete="off"
								bind:value={editLanguage}
								maxlength="5"
								placeholder="fr"
							/></label
						>
						{#if activeReader?.adult === true}
							<label class="adult">
								<input type="checkbox" name="book-adult" bind:checked={editAdult} />
								{$t.shelf.adultBook}
							</label>
						{/if}
						{#if editing.isbn13}
							<p class="muted isbn">{$t.scan.isbnLabel}: {editing.isbn13}</p>
						{/if}
						<button type="button" class="quiet delete" onclick={removeBook}>
							{$t.shelf.deleteBook}
						</button>
					</div>
				</details>
				<div class="actions dialog-actions">
					{#if statusOf(editing) === 'finished'}
						<button
							type="button"
							class="quiet"
							onclick={async () => {
								if (editing) await unread(editing);
								editing = null;
							}}
						>
							{$t.shelf.unread}
						</button>
					{/if}
					<button type="button" class="quiet" onclick={() => (editing = null)}>
						{$t.common.cancel}
					</button>
					<button type="submit" class="primary">{$t.common.save}</button>
				</div>
			</form>
		</div>
	{/if}
{/if}

<style>
	section {
		margin-bottom: 1.25rem;
	}

	form {
		display: grid;
		gap: 0.75rem;
	}

	.adult {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink);
		font-size: 1rem;
	}

	.adult input {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: var(--accent);
	}

	.emoji-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.emoji-pick {
		font-size: 1.4rem;
		border-radius: 50%;
		min-width: var(--tap);
	}

	.emoji-pick.picked {
		background: var(--accent-soft);
		outline: 2px solid var(--accent);
	}

	.top {
		display: grid;
		gap: 0.75rem;
	}

	/*
	 * One line that scrolls rather than two that wrap: on a 375px phone the four chips
	 * broke into a ragged second row. Scrollbar hidden; the cut-off chip edge is the
	 * affordance.
	 */
	.filters {
		display: flex;
		gap: 0.4rem;
		margin: 0.5rem 0;
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 0.1rem;
	}

	.filters::-webkit-scrollbar {
		display: none;
	}

	.filters .chip {
		flex: none;
	}

	.controls {
		display: flex;
		gap: 0.4rem;
		margin: 0.5rem 0;
	}

	.controls select {
		width: auto;
		flex: 1;
		min-width: 0;
		font-size: 0.875rem;
	}

	.chip {
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.3rem 0.9rem;
	}

	.chip.active {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}

	.count {
		font-size: 0.8125rem;
		font-weight: 400;
		color: var(--ink-soft);
	}

	.ladder-body {
		flex: 1;
		min-width: 0;
	}

	.rungs {
		display: flex;
		gap: 3px;
		margin-top: 0.45rem;
	}

	.rung {
		flex: 1;
		height: 7px;
		border-radius: 4px;
		background: var(--line);
	}

	.rung.done {
		background: var(--gold-fill);
	}

	.ladder {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		text-decoration: none;
		color: inherit;
	}

	.celebration {
		border-color: var(--gold-fill);
		background: #fffaf0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.earned {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/*
	 * Grid, not a single flex row: on a 375px phone the CTA and the pencil beside the
	 * text squeezed the title into one-word lines ("Le Petit / Prince"). The text now
	 * owns the full remaining width and the actions sit on their own row beneath it,
	 * with the cover spanning both.
	 */
	.book {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 0.75rem;
		row-gap: 0.4rem;
		align-items: start;
		margin-bottom: 0.5rem;
	}

	.cover {
		grid-row: 1 / 3;
		line-height: 0;
	}

	.detail {
		flex: 1;
		min-width: 0;
	}

	.detail p {
		margin: 0.1rem 0 0;
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	/* Only inside the card grid; the dialog's actions live in a one-column form. */
	.book .actions {
		grid-column: 2;
	}

	.actions .outline,
	.actions .primary {
		font-size: 0.8125rem;
		padding: 0.3rem 0.7rem;
	}

	.gold {
		color: var(--gold);
		font-weight: 600;
	}

	/*
	 * The one red control in the app. --alert is reserved for validation errors and destructive actions; reading activity never wears it (guardrail #7).
	 */
	.delete {
		color: var(--alert);
		margin-right: auto;
	}

	/*
	 * Scrollable, not just centered: the edit dialog outgrew an iPhone SE's viewport
	 * once price, location and language joined it, and `place-items: center` clips a
	 * too-tall child at BOTH ends with no way to scroll. Grid plus `margin: auto` on
	 * the child gives the same centring when it fits and honest scrolling when not.
	 */
	.overlay {
		position: fixed;
		inset: 0;
		display: grid;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		background: rgb(0 0 0 / 35%);
		padding: 1rem;
		z-index: 10;
	}

	.overlay form {
		width: 100%;
		max-width: 24rem;
		margin: auto;
	}

	/* In the dialog: destructive and corrective apart on the left, then cancel, then save. */
	.dialog-actions {
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.dialog-actions .quiet {
		font-size: 0.875rem;
	}

	.family {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0.3rem 0 0;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		padding: 0.1rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--ink-soft);
	}

	.pill.finished .glyph {
		color: var(--grow);
		font-weight: 700;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.advanced {
		border-top: 1px solid var(--line, #ddd);
		padding-top: 0.5rem;
	}

	.advanced summary {
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--muted, #666);
		min-height: var(--tap);
		display: flex;
		align-items: center;
	}

	/* The same grid rhythm as the form itself: labels keep their stacked layout. */
	.advanced-fields {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.advanced .delete {
		justify-self: start;
	}

	.read-before {
		display: flex;
		align-items: end;
		gap: 0.5rem;
	}

	.read-before label {
		flex: 1;
	}

	.read-before button {
		flex: none;
		font-size: 0.8125rem;
	}

	.isbn {
		font-size: 0.8125rem;
		margin: 0;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--ink-soft);
	}
</style>
