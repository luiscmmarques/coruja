<script lang="ts">
	/*
	 * Shown for any path the app does not have. Without this file SvelteKit's built-in error page appears instead: unstyled, untitled and offering no way back, which looks like the app is broken rather than the link.
	 *
	 * It renders inside +layout.svelte, so the header and the bottom navigation are already there and every screen is one tap away. Copy lives in the catalogue like every other screen.
	 */
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{page.status} · coruja</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<h1>{page.status}</h1>

<div class="card">
	<p>
		{#if page.status === 404}
			{$t.errorPage.notFound}
		{:else}
			{$t.errorPage.other}
		{/if}
	</p>
	<p><a href="/">{$t.errorPage.backHome}</a></p>
</div>

<style>
	.card p {
		margin: 0 0 0.625rem;
	}

	.card p:last-child {
		margin-bottom: 0;
	}
</style>
