<script lang="ts">
	/**
	 * Scan: the whole scanning ladder on one screen.
	 *
	 * Rungs 1 and 2 — native decoder, then wasm — belong to $lib/scanner and arrive here as raw EAN-13 strings. Rungs 3 and 4 are this file's: type the number under the barcode, or type the book itself when there is no barcode at all.
	 *
	 * There is no dead end anywhere on this page: every rung is reachable from every state, so a refused permission, a browser with no decoder and a 1974 paperback with no ISBN all end with a book on the shelf.
	 *
	 * ## Two small machines, not one big one
	 *
	 * `camera` is about the device: starting, live, or unavailable. `flow` is about the book in hand: idle, checking, duplicate, saving, done. Keeping them apart is what lets the manual forms work identically whether or not there is a camera, and what makes "pause scanning" a single condition — `flow` leaving `idle`.
	 *
	 * The stream is deliberately *not* torn down while a book is being handled: a family cataloguing a pile scans, confirms, scans again, and re-acquiring the camera between each book costs a second and a flicker. `onCode` is gated instead. The stream is stopped on unmount, unconditionally — a live track keeps the camera indicator lit even after the element is gone, which reads to a parent as an app watching the room.
	 */

	import { onMount } from 'svelte';
	import { addBook, enrichBook, findBookByIsbn, getBook } from '$lib/db';
	import { normalizeIsbn } from '$lib/domain/isbn';
	import type { Book, BookSource } from '$lib/domain/types';
	import { startScanner, type ScannerErrorKind, type ScannerHandle } from '$lib/scanner';
	import { t } from '$lib/i18n';

	/** The device. `unavailable` covers both no-camera and no-detector: same UI. */
	type Camera = 'starting' | 'live' | 'unavailable';
	/** The book in hand. Anything other than `idle` means scanning is paused. */
	type Flow = 'idle' | 'checking' | 'duplicate' | 'saving' | 'done';

	/**
	 * Endonyms, so the list needs no translating and no message keys: a French book is "Français" in every locale. The value stored is the base tag, which is what `two-tongues` counts.
	 */
	const LANGUAGES: readonly (readonly [string, string])[] = [
		['en', 'English'],
		['fr', 'Français'],
		['pt', 'Português'],
		['es', 'Español'],
		['de', 'Deutsch']
	];

	let camera = $state<Camera>('starting');
	let flow = $state<Flow>('idle');

	let videoEl = $state<HTMLVideoElement | null>(null);

	/** The ISBN accepted but not yet resolved — kept for "add a second copy". */
	let heldIsbn = $state<string | null>(null);
	let duplicate = $state<Book | null>(null);
	let savedTitle = $state('');
	/** Whether the lookup had to be queued, so the copy is reassurance not a title. */
	let savedQueued = $state(false);

	// Manual rungs. Open on request, and the ISBN one opens itself when there is no camera to fall back from.
	let isbnOpen = $state(false);
	let bookOpen = $state(false);

	let isbnInput = $state('');
	let isbnInvalid = $state(false);

	let titleInput = $state('');
	let authorInput = $state('');
	let pagesInput = $state('');
	let languageInput = $state('');

	const showVideo = $derived(camera !== 'unavailable');
	const showIsbnForm = $derived(isbnOpen || camera === 'unavailable');

	onMount(() => {
		// Captured as a const: narrowing on a `let` does not survive into the closure below, and the element cannot change while this instance is mounted.
		const video = videoEl;
		if (!video) return;

		let cancelled = false;
		let handle: ScannerHandle | null = null;

		void (async () => {
			const started = await startScanner(video, onCode, onError);
			// The permission prompt may have outlived the component.
			if (cancelled) {
				started.stop();
				return;
			}
			handle = started;
			// `onError` may already have moved us on; only `starting` is ours to leave.
			if (camera === 'starting') camera = 'live';
		})();

		return () => {
			cancelled = true;
			handle?.stop();
			handle = null;
		};
	});

	/**
	 * Every decoded frame arrives here, several times a second while a book sits in front of the lens, and misreads arrive alongside the truth. A failed checksum is therefore not an error to report but a frame to drop: only a real ISBN-13 stops the scan.
	 */
	function onCode(raw: string): void {
		if (camera !== 'live' || flow !== 'idle') return;
		const isbn = normalizeIsbn(raw);
		if (!isbn) return;
		void accept(isbn, 'scan');
	}

	function onError(kind: ScannerErrorKind): void {
		// `no-camera` and `no-detector` mean the same thing to a parent holding a book: no camera here, type the number. The distinction matters to scanner.ts, which has already released the stream in both cases, not to this screen.
		console.info('[coruja] scanning unavailable:', kind);
		camera = 'unavailable';
	}

	/** Duplicate check, then add. The single door every ISBN goes through. */
	async function accept(isbn13: string, source: BookSource): Promise<void> {
		flow = 'checking';
		heldIsbn = isbn13;
		duplicate = null;

		try {
			const existing = await findBookByIsbn(isbn13);
			if (existing) {
				duplicate = existing;
				flow = 'duplicate';
				return;
			}
			await save(isbn13, source);
		} catch (error) {
			console.error('[coruja] could not add the scanned book', error);
			flow = 'idle';
		}
	}

	/**
	 * The row lands immediately with the ISBN as its provisional title, then the lookup renames it. Adding a book never waits on the network, so an offline scan is a book on the shelf and a queued lookup rather than a failure.
	 */
	async function save(isbn13: string, source: BookSource): Promise<void> {
		flow = 'saving';
		const book = await addBook({ title: isbn13, source, isbn13 });
		const result = await enrichBook(book.id, isbn13);
		// Re-read rather than trusting the local object: applyMetadata wrote the title.
		const enriched = await getBook(book.id);
		savedTitle = enriched?.title ?? isbn13;
		savedQueued = result === 'queued';
		flow = 'done';
	}

	async function addSecondCopy(): Promise<void> {
		if (!heldIsbn) return;
		try {
			await save(heldIsbn, 'scan');
		} catch (error) {
			console.error('[coruja] could not add the second copy', error);
			flow = 'idle';
		}
	}

	/** Back to looking. A pile of books is one session, not one scan. */
	function resume(): void {
		flow = 'idle';
		duplicate = null;
		heldIsbn = null;
		savedTitle = '';
		savedQueued = false;
	}

	async function submitIsbn(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		const isbn = normalizeIsbn(isbnInput);
		if (!isbn) {
			isbnInvalid = true;
			return;
		}
		isbnInvalid = false;
		isbnInput = '';
		// Typed, so recorded as typed: `manual` with an ISBN is honest provenance, and still not the Cataloguer badge, which wants a book with no ISBN at all.
		await accept(isbn, 'manual');
	}

	/**
	 * A book the internet has never heard of. No ISBN, no lookup, no apology — a first-class book, and the one that earns Cataloguer.
	 */
	async function submitBook(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		const title = titleInput.trim();
		if (!title) return;

		const pages = Number.parseInt(pagesInput, 10);
		try {
			const book = await addBook({
				title,
				authors: [authorInput.trim()].filter(Boolean),
				pageCount: Number.isFinite(pages) && pages > 0 ? pages : undefined,
				language: languageInput || undefined,
				source: 'manual'
			});
			savedTitle = book.title;
			savedQueued = false;
			flow = 'done';
			titleInput = '';
			authorInput = '';
			pagesInput = '';
			languageInput = '';
			bookOpen = false;
		} catch (error) {
			console.error('[coruja] could not add the book', error);
		}
	}
</script>

<svelte:head>
	<title>{$t.scan.title} · coruja</title>
	<meta name="description" content={$t.scan.metaDescription} />
</svelte:head>

<h1>{$t.scan.title}</h1>

{#if showVideo}
	<section class="viewfinder">
		<video bind:this={videoEl} muted playsinline></video>
		<p>{$t.scan.prompt}</p>
		<p class="muted" aria-live="polite">
			{#if flow === 'idle' && camera === 'live'}{$t.scan.scanning}
			{:else if camera === 'starting'}{$t.common.loading}{/if}
		</p>
		<button
			type="button"
			class="quiet toggle"
			class:active={isbnOpen}
			aria-expanded={isbnOpen}
			onclick={() => (isbnOpen = !isbnOpen)}
		>
			{$t.scan.manualEntry}
		</button>
	</section>
{:else}
	<section class="card">
		<p>{$t.scan.cameraUnavailable}</p>
	</section>
{/if}

<!-- The book in hand. One card at a time, and always with a way onward. -->
{#if flow === 'checking' || flow === 'saving'}
	<section class="card status" aria-live="polite">
		<p class="busy">
			<span class="spinner" aria-hidden="true"></span>
			{flow === 'saving' ? $t.scan.searchingMetadata : $t.common.loading}
		</p>
	</section>
{:else if flow === 'duplicate' && duplicate}
	<section class="card status" aria-live="polite">
		<p>{$t.scan.alreadyOnShelf}</p>
		<p class="muted">
			<strong>{duplicate.title}</strong>
			{#if duplicate.authors.length}
				· {$t.shelf.byAuthor(duplicate.authors.join(', '))}
			{/if}
		</p>
		<div class="actions">
			<a class="as-button primary" href="/">{$t.scan.viewExisting}</a>
			<button type="button" onclick={addSecondCopy}>{$t.scan.addAnyway}</button>
		</div>
	</section>
{:else if flow === 'done'}
	<section class="card status" aria-live="polite">
		<p>{savedQueued ? $t.scan.offlineQueued : $t.scan.added(savedTitle)}</p>
		<div class="actions">
			{#if camera === 'live'}
				<button type="button" class="primary" onclick={resume}>{$t.nav.scan}</button>
			{:else}
				<button type="button" class="primary" onclick={resume}>{$t.common.close}</button>
			{/if}
			<a class="as-button" href="/">{$t.nav.shelf}</a>
		</div>
	</section>
{/if}

{#if showIsbnForm}
	<section class="card">
		<form onsubmit={submitIsbn}>
			<label>
				{$t.scan.isbnLabel}
				<input
					type="text"
					name="isbn"
					inputmode="numeric"
					autocomplete="off"
					bind:value={isbnInput}
					aria-invalid={isbnInvalid ? 'true' : undefined}
					aria-describedby={isbnInvalid ? 'isbn-error' : undefined}
					required
				/>
			</label>
			{#if isbnInvalid}
				<p id="isbn-error" class="error" aria-live="polite">{$t.scan.isbnInvalid}</p>
			{/if}
			<button type="submit" class="primary">{$t.common.add}</button>
		</form>
	</section>
{/if}

<section>
	<button
		type="button"
		class="quiet toggle"
		class:active={bookOpen}
		aria-expanded={bookOpen}
		onclick={() => (bookOpen = !bookOpen)}
	>
		{$t.scan.addManually}
	</button>

	{#if bookOpen}
		<div class="card">
			<form onsubmit={submitBook}>
				<label>
					{$t.scan.titleLabel}
					<input
						type="text"
						name="book-title"
						autocomplete="off"
						bind:value={titleInput}
						required
					/>
				</label>
				<label>
					{$t.scan.authorLabel}
					<input type="text" name="book-author" autocomplete="off" bind:value={authorInput} />
				</label>
				<label>
					{$t.scan.pagesLabel}
					<input
						type="number"
						name="book-pages"
						min="1"
						inputmode="numeric"
						bind:value={pagesInput}
					/>
				</label>
				<label>
					{$t.scan.languageLabel}
					<select name="book-language" bind:value={languageInput}>
						<option value="">{$t.common.none}</option>
						{#each LANGUAGES as [code, name] (code)}
							<option value={code}>{name}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class="primary">{$t.common.add}</button>
			</form>
		</div>
	{/if}
</section>

<style>
	section {
		margin-bottom: 1rem;
	}

	.viewfinder {
		display: grid;
		gap: 0.4rem;
		justify-items: start;
	}

	video {
		width: 100%;
		/* Held portrait, and reserved before the first frame so nothing jumps. */
		aspect-ratio: 3 / 4;
		max-height: 60vh;
		object-fit: cover;
		border-radius: var(--radius);
		background: #000;
	}

	.viewfinder p {
		margin: 0;
	}

	.toggle {
		min-height: var(--tap);
		text-decoration: underline;
		color: var(--accent);
	}

	.toggle.active {
		background: var(--accent-soft);
		border-radius: var(--radius);
		text-decoration: none;
		font-weight: 600;
	}

	.status {
		border-color: var(--accent);
	}

	.busy {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	/*
	 * The wait is real: up to two providers, each on its own budget, and Open Library
	 * requests deliberately paced to its 1-per-second etiquette. The ring says
	 * "working"; the copy stays the reassurance. The book row is already saved before
	 * this card ever shows — the spinner is about the name arriving, never about
	 * whether the book made it onto the shelf.
	 */
	.spinner {
		flex: none;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 3px solid var(--accent-soft);
		border-top-color: var(--accent);
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Slowed, not frozen: a stopped ring reads as a hang, which is the wrong message. */
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 2.5s;
		}
	}

	form {
		display: grid;
		gap: 0.75rem;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--ink-soft);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	/* app.css styles `button.primary`; a link that acts as one needs the look here. */
	.as-button {
		display: inline-grid;
		place-items: center;
		min-height: var(--tap);
		padding: 0.4rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		text-decoration: none;
		color: var(--accent);
		font-weight: 600;
	}

	.as-button.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
</style>
