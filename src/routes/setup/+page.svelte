<script lang="ts">
	/**
	 * Setup: the four things a household ever needs to change — who reads, in which language, whether the app may ask the internet about a barcode, and how to get a copy of the shelf out of this browser.
	 *
	 * Nothing here is a preference for its own sake. Every control either names a person, changes what the child reads, switches off the app's only network egress, or is the one path by which the data survives a lost phone.
	 */
	import {
		editCollection,
		addCollection,
		deleteCollection,
		collectionsStore,
		addReader,
		archiveReader,
		editReader,
		exportBackup,
		googleBooksAvailable,
		importBackup,
		readersStore,
		saveSettings,
		settingsStore
	} from '$lib/db';
	import { LOCALES, type Locale } from '$lib/domain/locale';
	import type { ImportError } from '$lib/domain/transfer';
	import { browserLocale } from '$lib/locale';
	import { t } from '$lib/i18n';
	import { COLLECTION_EMOJI, READER_EMOJI, type Collection, type Reader } from '$lib/domain/types';
	import { hashPin, isValidPin, pinMatches } from '$lib/domain/pin';
	import { persistence } from '$lib/persistence';

	// Same avatars as the shelf's first-run form: one child, one set of animals, wherever she is asked to pick.

	const collections = $derived(
		($collectionsStore ?? []).toSorted((a, b) => a.name.localeCompare(b.name))
	);
	const readers = $derived(($readersStore ?? []).filter((r) => !r.archived));
	const settings = $derived($settingsStore);

	// --- readers ---
	let newName = $state('');
	let newEmoji = $state(READER_EMOJI[0]);
	let newAdult = $state(false);

	async function createReader(event: SubmitEvent) {
		event.preventDefault();
		if (!newName.trim()) return;
		// Marking 16+ is what the PIN protects, so granting it at creation asks too:
		// otherwise a child adds a fresh "adult" and walks around the whole gate.
		if (newAdult && !(await verifyCurrentPin())) return;
		await addReader(newName, newEmoji, 'var(--accent)', newAdult);
		newName = '';
		newEmoji = READER_EMOJI[0];
		newAdult = false;
	}

	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editEmoji = $state('');
	let editAdult = $state(false);

	function openReaderEdit(reader: Reader) {
		editingId = reader.id;
		editName = reader.name;
		editEmoji = reader.emoji;
		editAdult = reader.adult === true;
	}

	async function saveReaderEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!editingId || !editName.trim()) return;
		// Turning 16+ ON is the escalation the PIN exists for: without this check a
		// child edits her own profile, ticks the box, and every adult book appears.
		// Turning it OFF asks nothing; de-escalation needs no lock.
		const wasAdult = readers.find((r) => r.id === editingId)?.adult === true;
		if (editAdult && !wasAdult && !(await verifyCurrentPin())) return;
		await editReader(editingId, { name: editName.trim(), emoji: editEmoji, adult: editAdult });
		editingId = null;
	}

	async function archive(reader: Reader) {
		// Archiving hides a person from every screen, so it asks first. It is reversible in the data — the row and its readings stay — but not from this screen.
		if (!confirm(`${$t.setup.archiveReader}: ${reader.name}?`)) return;
		await archiveReader(reader.id);
	}

	// --- language ---
	/**
	 * The language the device asks for, named on the "follow my device" option so the choice is not a leap of faith. Read once: it cannot change while the app is open.
	 */
	const deviceLabel = $derived(
		LOCALES.find((entry) => entry.value === browserLocale())?.label ?? 'English'
	);

	/** '' means "no override" — the empty value the follow-my-device option carries. */
	const localeValue = $derived(settings?.locale ?? '');

	async function chooseLocale(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		/*
		 * Clearing the override saves `locale: undefined`. saveSettings spreads the patch over the current row, and an own key whose value is undefined still overwrites — so the old 'fr' does not survive. Whether IndexedDB keeps the key with an undefined value or drops it is immaterial: `$settings?.locale ?? browserLocale()` reads both as "follow the device".
		 */
		await saveSettings({ locale: value === '' ? undefined : (value as Locale) });
	}

	// --- book lookup ---
	/** Absent means on: the app looks books up until someone says not to. */
	const lookupEnabled = $derived(settings?.lookupEnabled !== false);

	async function chooseLookup(enabled: boolean) {
		await saveSettings({ lookupEnabled: enabled });
	}

	/** Absent means on, like the main switch: the second source has its own off. */
	const googleEnabled = $derived(settings?.googleBooksEnabled !== false);

	async function chooseGoogle(event: Event) {
		await saveSettings({
			googleBooksEnabled: (event.currentTarget as HTMLInputElement).checked
		});
	}

	// --- backup ---
	let fileInput = $state<HTMLInputElement | null>(null);
	let importErrorKey = $state<ImportError | null>(null);

	const importErrorText = $derived(importErrorKey ? $t.setup.importError[importErrorKey] : '');

	// --- family PIN ---
	let pinDraft = $state('');
	let pinError = $state(false);

	async function setPin(event: SubmitEvent) {
		event.preventDefault();
		if (!isValidPin(pinDraft)) {
			pinError = true;
			return;
		}
		pinError = false;
		await saveSettings({ adultPinHash: await hashPin(pinDraft) });
		pinDraft = '';
	}

	/** Change and remove both re-ask the current PIN: the setting protects itself. */
	async function verifyCurrentPin(): Promise<boolean> {
		const hash = settings?.adultPinHash;
		if (!hash) return true;
		const answer = prompt($t.setup.pinCurrent);
		if (answer === null) return false;
		if (await pinMatches(answer, hash)) return true;
		alert($t.setup.pinWrong);
		return false;
	}

	async function changePin() {
		if (!(await verifyCurrentPin())) return;
		const next = prompt($t.setup.pinNew);
		if (next === null) return;
		if (!isValidPin(next)) {
			alert($t.setup.pinInvalid);
			return;
		}
		await saveSettings({ adultPinHash: await hashPin(next) });
	}

	async function removePin() {
		if (!(await verifyCurrentPin())) return;
		await saveSettings({ adultPinHash: undefined });
	}

	async function exportNow() {
		const backup = await exportBackup();
		const blob = new Blob([JSON.stringify(backup, null, '\t')], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `coruja-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	/** parseImport throws stable keys, not prose; anything else is a damaged file. */
	function toImportError(message: string): ImportError {
		return message === 'not-json' || message === 'wrong-app' || message === 'unsupported-version'
			? message
			: 'malformed';
	}

	async function importChosen(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		// Cleared either way, so picking the same file twice still fires a change.
		input.value = '';
		if (!file) return;

		importErrorKey = null;
		if (!confirm($t.setup.importConfirm)) return;

		try {
			await importBackup(await file.text());
		} catch (error) {
			importErrorKey = toImportError(error instanceof Error ? error.message : '');
		}
	}

	let newCollectionName = $state('');
	let newCollectionEmoji = $state<string>(COLLECTION_EMOJI[0]);
	let editingCollectionId = $state<string | null>(null);
	let editCollectionName = $state('');
	let editCollectionEmoji = $state<string>(COLLECTION_EMOJI[0]);

	function openCollectionEdit(collection: Collection) {
		editingCollectionId = collection.id;
		editCollectionName = collection.name;
		editCollectionEmoji = collection.emoji;
	}

	async function saveCollectionEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!editingCollectionId || !editCollectionName.trim()) return;
		await editCollection(editingCollectionId, {
			name: editCollectionName.trim(),
			emoji: editCollectionEmoji
		});
		editingCollectionId = null;
	}

	async function createCollection(event: SubmitEvent) {
		event.preventDefault();
		if (!newCollectionName.trim()) return;
		await addCollection(newCollectionName, newCollectionEmoji);
		newCollectionName = '';
		newCollectionEmoji = COLLECTION_EMOJI[0];
	}

	async function removeCollection(id: string, name: string) {
		if (!confirm($t.shelf.collectionDeleteConfirm(name))) return;
		await deleteCollection(id);
	}
</script>

<svelte:head>
	<title>{$t.setup.title} · coruja</title>
	<meta name="description" content={$t.setup.metaDescription} />
</svelte:head>

<h1>{$t.setup.title}</h1>

<section class="card">
	<h2>{$t.setup.readersTitle}</h2>

	{#if $readersStore === undefined}
		<p class="muted">{$t.common.loading}</p>
	{:else if readers.length === 0}
		<p class="muted">{$t.common.none}</p>
	{:else}
		<ul class="readers">
			{#each readers as reader (reader.id)}
				<li>
					{#if editingId === reader.id}
						<form class="reader-edit" onsubmit={saveReaderEdit}>
							<label>
								{$t.setup.readerName}
								<input
									type="text"
									name="reader-edit-name"
									autocomplete="off"
									bind:value={editName}
									required
								/>
							</label>
							<div class="emoji-row" role="group" aria-label={$t.setup.renameReader}>
								{#each READER_EMOJI as emoji (emoji)}
									<button
										type="button"
										class="quiet emoji-pick"
										class:picked={editEmoji === emoji}
										aria-pressed={editEmoji === emoji}
										onclick={() => (editEmoji = emoji)}
									>
										{emoji}
									</button>
								{/each}
							</div>
							<label class="adult">
								<input type="checkbox" name="reader-edit-adult" bind:checked={editAdult} />
								{$t.setup.adultReader}
							</label>
							<div class="edit-actions">
								<button type="button" class="quiet archive" onclick={() => archive(reader)}>
									{$t.setup.archiveReader}
								</button>
								<button type="button" class="quiet" onclick={() => (editingId = null)}>
									{$t.common.cancel}
								</button>
								<button type="submit" class="primary">{$t.common.save}</button>
							</div>
						</form>
					{:else}
						<span class="avatar" aria-hidden="true">{reader.emoji}</span>
						<span class="name">{reader.name}</span>
						{#if reader.adult}<span class="tag" title={$t.setup.adultReader}>🌙</span>{/if}
						<button
							class="icon"
							aria-label={$t.setup.renameReader}
							onclick={() => openReaderEdit(reader)}
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
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<form onsubmit={createReader}>
		<label>
			{$t.setup.readerName}
			<input type="text" name="reader-name" autocomplete="off" bind:value={newName} required />
		</label>
		<!--
			Toggle buttons in a group rather than role="radio": these are individually tabbable, which is what a radiogroup promises not to be. aria-pressed carries the state honestly, and a child using a switch or a screen reader gets a stop per animal instead of one arrow-key trap.
		-->
		<div class="emoji-row" role="group" aria-label={$t.setup.addReader}>
			{#each READER_EMOJI as emoji (emoji)}
				<button
					type="button"
					class="quiet emoji-pick"
					class:picked={newEmoji === emoji}
					aria-pressed={newEmoji === emoji}
					aria-label={emoji}
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

<section class="card">
	<h2>{$t.setup.languageTitle}</h2>
	<label>
		<span class="visually-hidden">{$t.setup.languageTitle}</span>
		<select name="app-language" value={localeValue} onchange={chooseLocale}>
			<option value="">{$t.setup.followBrowser(deviceLabel)}</option>
			{#each LOCALES as entry (entry.value)}
				<option value={entry.value}>{entry.label}</option>
			{/each}
		</select>
	</label>
</section>

<section class="card">
	<h2>{$t.setup.lookupTitle}</h2>
	<p class="muted">{$t.setup.lookupExplain}</p>
	<div class="choices" role="radiogroup" aria-label={$t.setup.lookupTitle}>
		<label class="choice">
			<input
				type="radio"
				name="lookup"
				checked={lookupEnabled}
				onchange={() => chooseLookup(true)}
			/>
			{$t.setup.lookupOn}
		</label>
		<label class="choice">
			<input
				type="radio"
				name="lookup"
				checked={!lookupEnabled}
				onchange={() => chooseLookup(false)}
			/>
			{$t.setup.lookupOff}
		</label>
	</div>
	{#if googleBooksAvailable && lookupEnabled}
		<!-- On by default like the main switch, but its own switch all the same: Open Library is a non-profit and the privacy page leans on that, so the second source can be turned off alone. Hidden entirely in a build without a key — a toggle that does nothing would be dishonest. -->
		<label class="choice google">
			<input type="checkbox" name="google-lookup" checked={googleEnabled} onchange={chooseGoogle} />
			{$t.setup.googleLookup}
		</label>
		<p class="muted">{$t.setup.googleLookupExplain}</p>
	{/if}
</section>

<section class="card">
	<h2>{$t.shelf.collectionsLabel}</h2>

	{#if collections.length === 0}
		<p class="muted">{$t.common.none}</p>
	{:else}
		<ul class="readers collection-list">
			{#each collections as collection (collection.id)}
				<li>
					{#if editingCollectionId === collection.id}
						<form class="reader-edit" onsubmit={saveCollectionEdit}>
							<label>
								{$t.shelf.collectionName}
								<input
									type="text"
									name="collection-edit-name"
									autocomplete="off"
									bind:value={editCollectionName}
									required
								/>
							</label>
							<div class="emoji-row" role="group" aria-label={$t.shelf.collectionEmoji}>
								{#each COLLECTION_EMOJI as emoji (emoji)}
									<button
										type="button"
										class="quiet emoji-pick"
										class:picked={editCollectionEmoji === emoji}
										aria-pressed={editCollectionEmoji === emoji}
										aria-label={emoji}
										onclick={() => (editCollectionEmoji = emoji)}
									>
										{emoji}
									</button>
								{/each}
							</div>
							<div class="edit-actions">
								<button
									type="button"
									class="quiet archive"
									onclick={() => removeCollection(collection.id, collection.name)}
								>
									{$t.common.delete}
								</button>
								<button type="button" class="quiet" onclick={() => (editingCollectionId = null)}>
									{$t.common.cancel}
								</button>
								<button type="submit" class="primary">{$t.common.save}</button>
							</div>
						</form>
					{:else}
						<span class="avatar" aria-hidden="true">{collection.emoji}</span>
						<span class="name">{collection.name}</span>
						<button
							class="icon"
							aria-label={$t.shelf.collectionEdit}
							onclick={() => openCollectionEdit(collection)}
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
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<form onsubmit={createCollection}>
		<label>
			{$t.shelf.collectionName}
			<input
				type="text"
				name="collection-name"
				autocomplete="off"
				bind:value={newCollectionName}
				required
			/>
		</label>
		<div class="emoji-row" role="group" aria-label={$t.shelf.collectionEmoji}>
			{#each COLLECTION_EMOJI as emoji (emoji)}
				<button
					type="button"
					class="quiet emoji-pick"
					class:picked={newCollectionEmoji === emoji}
					aria-pressed={newCollectionEmoji === emoji}
					aria-label={emoji}
					onclick={() => (newCollectionEmoji = emoji)}
				>
					{emoji}
				</button>
			{/each}
		</div>
		<button type="submit" class="primary">{$t.shelf.collectionAdd}</button>
	</form>
</section>

<section class="card">
	<h2>{$t.setup.pinTitle}</h2>
	<p class="muted">{$t.setup.pinExplain}</p>
	{#if settings?.adultPinHash}
		<div class="pin-actions">
			<button onclick={changePin}>{$t.setup.pinChange}</button>
			<button onclick={removePin}>{$t.setup.pinRemove}</button>
		</div>
	{:else}
		<form class="pin-form" onsubmit={setPin}>
			<input
				type="text"
				name="family-pin"
				inputmode="numeric"
				autocomplete="off"
				placeholder={$t.setup.pinPlaceholder}
				bind:value={pinDraft}
			/>
			<button type="submit" class="primary">{$t.setup.pinSet}</button>
		</form>
		{#if pinError}<p class="error">{$t.setup.pinInvalid}</p>{/if}
	{/if}
</section>

<section class="card">
	<h2>{$t.setup.backupTitle}</h2>
	<p class="muted">{$t.setup.backupExplain}</p>
	{#if $persistence === 'refused'}
		<!-- Only the refusal is worth a sentence: granted needs no medal and an
		     unsupported browser offers nothing the user can act on. -->
		<p class="muted">{$t.setup.storageNotGuaranteed}</p>
	{/if}
	<div class="actions">
		<button onclick={exportNow}>{$t.setup.exportButton}</button>
		<button onclick={() => fileInput?.click()}>{$t.setup.importButton}</button>
	</div>
	<!-- The real control; the button above is its visible, tap-sized label. -->
	<input
		bind:this={fileInput}
		class="visually-hidden"
		name="backup-file"
		type="file"
		accept=".json,application/json"
		aria-label={$t.setup.importButton}
		onchange={importChosen}
	/>
	{#if importErrorText}
		<p class="error" aria-live="polite">{importErrorText}</p>
	{/if}
</section>

<footer>
	<p class="muted">{$t.setup.aboutVersion(__APP_VERSION__)}</p>
	<p class="links">
		<a href="/about">{$t.menu.about}</a>
		<a href="/privacy">{$t.menu.privacy}</a>
	</p>
</footer>

<style>
	h1 {
		margin-bottom: 0.75rem;
	}

	section {
		margin-bottom: 1rem;
	}

	.pin-form {
		display: flex;
		gap: 0.4rem;
	}

	.pin-form input {
		flex: 1;
		min-width: 0;
	}

	.pin-actions {
		display: flex;
		gap: 0.4rem;
	}

	.adult {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
	}

	.adult input {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: var(--accent);
	}

	.reader-edit {
		display: grid;
		gap: 0.5rem;
		width: 100%;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.4rem;
	}

	/* Archiving sits apart from save/cancel, and reads as the caution it is. */
	.archive {
		margin-right: auto;
		color: var(--alert);
		font-size: 0.875rem;
	}

	.readers {
		list-style: none;
		margin: 0 0 0.75rem;
		padding: 0;
	}

	.readers li {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0 0.6rem;
		min-height: var(--tap);
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--line);
	}

	/*
	 * The name owns the leftover width and truncates with an ellipsis; without this it
	 * had no width of its own, and a long name ran straight into the Edit button
	 * (screenshot evidence: "SophiaSnoEdit"). The buttons never shrink or break — on a
	 * narrow phone with a long name the row wraps instead, which is the honest layout.
	 */
	/*
	 * The moon marks profiles that see everything: owls and grown-ups are the ones
	 * still up after bedtime. An emoji, so it needs no translation in any of the five
	 * languages; slightly faded, so a child's row stays the plain one. The full
	 * meaning rides on the tooltip.
	 */
	.tag {
		flex: none;
		font-size: 0.8125rem;
		opacity: 0.75;
	}

	.name {
		flex: 1;
		min-width: 4rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.readers li button {
		flex: none;
		white-space: nowrap;
	}

	.readers li:last-child {
		border-bottom: none;
	}

	.avatar {
		font-size: 1.5rem;
	}

	.name {
		flex: 1;
		min-width: 0;
		font-weight: 600;
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

	.choices {
		display: grid;
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	/* Radios sit inline with their words, and the whole row is a tap target. */
	.choice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: var(--tap);
		font-size: 1rem;
		color: var(--ink);
	}

	.choice input {
		width: 1.15rem;
		height: 1.15rem;
		flex: none;
		accent-color: var(--accent);
	}

	/* The opt-in sits apart from the on/off pair: a different decision, not a third option. */
	.google {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--line);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	/*
	 * Hidden, not display:none — a label or a file input the keyboard cannot reach is one some people do not have.
	 */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	footer {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.links {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.links a {
		display: inline-grid;
		place-items: center;
		min-height: var(--tap);
		padding: 0 0.5rem;
	}
</style>
