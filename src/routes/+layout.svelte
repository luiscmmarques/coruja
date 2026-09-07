<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { watchStoredData } from '$lib/persistence';
	import { readersStore, saveSettings, settingsStore, watchConnectivity } from '$lib/db';
	import { pinMatches } from '$lib/domain/pin';
	import { registerServiceWorker } from '$lib/registerServiceWorker';
	import lockupSvg from '$lib/assets/lockup.svg?raw';
	import '../app.css';

	let { children } = $props();

	// Offline support. Deliberately explicit; see the module for why.
	onMount(() => {
		// Ask the browser to keep this origin once there is a book to lose.
		// See src/lib/persistence.ts for why not sooner.
		const stopPersistence = watchStoredData();
		void registerServiceWorker();
		return stopPersistence;
	});

	// Drain queued lookups on start and whenever connectivity returns.
	onMount(() => watchConnectivity());

	const tabs = $derived([
		{ href: '/', label: $t.nav.shelf },
		{ href: '/scan', label: $t.nav.scan, prominent: true },
		{ href: '/badges', label: $t.nav.badges },
		{ href: '/setup', label: $t.nav.setup }
	]);

	function isCurrent(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	/*
	 * Content-page menu. A burger rather than a row of links because the header is already carrying the lockup and the setup gear, and on a 390px phone there is no room left. Nothing anyone needs daily is behind it.
	 */
	let menuOpen = $state(false);

	/*
	 * Closed by watching the route rather than in each link's click handler: detaching an anchor inside its own click handler can cancel the navigation it was supposed to start — and this way the menu also closes on back and forward, which a click handler never would. (Graftful's lesson, kept.)
	 */
	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});

	/*
	 * The active reader, shown and switchable from every page: whose ladder the shelf
	 * shows, who a scanned book gets attributed to, whose badges the badges page lists.
	 * Hidden with a single reader — a switch with one position is furniture.
	 */
	const readers = $derived(($readersStore ?? []).filter((r) => !r.archived));
	const activeReaderId = $derived(
		(readers.find((r) => r.id === $settingsStore?.activeReaderId) ?? readers[0])?.id
	);

	/*
	 * Switching TO an adult profile asks for the family PIN when one is set — the lock
	 * that makes hiding adult books mean something, since the switcher is one tap.
	 * Switching to a child's profile is always free. prompt() rather than a styled
	 * dialog: it is a child lock, and the native prompt is modal, focusable and done.
	 */
	async function switchReader(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const target = readers.find((r) => r.id === select.value);
		const pinHash = $settingsStore?.adultPinHash;
		const activeIsAdult = readers.find((r) => r.id === activeReaderId)?.adult === true;

		if (target?.adult === true && !activeIsAdult && pinHash) {
			const answer = prompt($t.setup.pinPrompt);
			if (answer === null || !(await pinMatches(answer, pinHash))) {
				if (answer !== null) alert($t.setup.pinWrong);
				select.value = activeReaderId ?? '';
				return;
			}
		}
		await saveSettings({ activeReaderId: select.value });
	}

	const content = $derived([
		{ href: '/about', label: $t.menu.about },
		{ href: '/privacy', label: $t.menu.privacy },
		{ href: '/support', label: $t.menu.support }
	]);
</script>

<svelte:head>
	<!-- Each prerendered page names itself as its own canonical; see app.html for why it is not there. -->
	<link rel="canonical" href={'https://coruja.app' + page.url.pathname} />
</svelte:head>

<div class="app">
	<header>
		<!--
			The lockup, inlined: it carries the name as outlined paths, so header, link preview and printed flyer all show the same thing (DESIGN.md, "one file removes the question").
		-->
		<a href="/" class="home" aria-label="coruja">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-generated asset -->
			{@html lockupSvg}
		</a>
		<div class="header-actions">
			{#if readers.length > 1}
				<select
					name="active-reader"
					class="reader-switch"
					aria-label={$t.shelf.whoIsReading}
					value={activeReaderId}
					onchange={(event) => switchReader(event)}
				>
					{#each readers as reader (reader.id)}
						<option value={reader.id}>
							{reader.emoji}
							{reader.name}{reader.adult ? ' 🌙' : ''}
						</option>
					{/each}
				</select>
			{/if}
			<button
				class="quiet icon-button"
				aria-label={$t.menu.label}
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<!-- Three lines drawn rather than a character: ☰ renders wildly across platforms. -->
				<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
					<path
						d="M3 5h14M3 10h14M3 15h14"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
			{#if menuOpen}
				<nav class="menu card" aria-label={$t.menu.label}>
					{#each content as item (item.href)}
						<a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
							{item.label}
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	</header>

	<main>
		{@render children()}
	</main>

	<nav class="tabs" aria-label={$t.nav.shelf}>
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class:prominent={tab.prominent}
				aria-current={isCurrent(tab.href) ? 'page' : undefined}
			>
				{tab.label}
			</a>
		{/each}
	</nav>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 40rem;
		margin: 0 auto;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem 0.5rem;
	}

	.home {
		color: var(--accent);
		line-height: 0;
	}

	.home :global(svg) {
		height: 28px;
		width: auto;
	}

	.header-actions {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.1rem;
	}

	.reader-switch {
		width: auto;
		max-width: 9rem;
		min-height: 2.25rem;
		padding: 0.15rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.icon-button {
		display: grid;
		place-items: center;
		min-width: var(--tap);
		min-height: var(--tap);
		font-size: 1.35rem;
		text-decoration: none;
		color: var(--ink-soft);
		border: none;
		background: none;
		padding: 0;
	}

	.menu {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 20;
		display: grid;
		min-width: 11rem;
		padding: 0.35rem;
		box-shadow: 0 6px 24px rgb(0 0 0 / 12%);
	}

	.menu a {
		display: flex;
		align-items: center;
		min-height: var(--tap);
		padding: 0 0.75rem;
		border-radius: calc(var(--radius) - 0.2rem);
		text-decoration: none;
		color: var(--ink);
	}

	.menu a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}

	main {
		flex: 1;
		padding: 0.5rem 1rem 5.5rem;
	}

	nav.tabs {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
		background: var(--surface);
		border-top: 1px solid var(--line);
	}

	.tabs a {
		flex: 1;
		max-width: 9rem;
		display: grid;
		place-items: center;
		min-height: var(--tap);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--ink-soft);
		font-weight: 600;
	}

	.tabs a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-soft);
	}

	/* Scan gets the centre and the prominence: it is the action a child comes for. */
	.tabs a.prominent {
		background: var(--accent);
		color: #fff;
	}
</style>
