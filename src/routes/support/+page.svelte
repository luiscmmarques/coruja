<script lang="ts">
	/*
	 * The page leads with what helps most, telling another family, and the money card
	 * speaks plainly and warmly: the app is a parent's evenings and weekends, not just a
	 * domain bill. The PayPal link lives in SupportButton.svelte, one place, one URL.
	 * Prerendered in English, swapped on hydration; see about/+page.svelte.
	 */
	import SupportButton from '$lib/SupportButton.svelte';
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t.support.title} · coruja</title>
	<meta name="description" content={$t.support.metaDescription} />
</svelte:head>

<article class="prose">
	<h1>{$t.support.title}</h1>

	<div class="card">
		<p>{$t.support.intro}</p>
	</div>

	<div class="card">
		<h2>{$t.support.helpsTitle}</h2>
		<ul>
			<li>
				<strong>{$t.support.tellLead}</strong>
				{$t.support.tellBody}
			</li>
			<li>
				<strong>{$t.support.addLead}</strong>
				{$t.support.addBefore}
				<a href="https://openlibrary.org" rel="noopener">Open Library</a>{$t.support.addAfter}
			</li>
			<li>
				<strong>{$t.support.sayLead}</strong>
				{$t.support.sayBefore}
				<a href="mailto:hi@coruja.app">hi@coruja.app</a>{$t.support.sayAfter}
			</li>
		</ul>
	</div>

	<div class="card">
		<h2>{$t.support.giveTitle}</h2>
		<p>{$t.support.give1}</p>
		<p class="muted">{$t.support.give2}</p>
		<p class="give"><SupportButton label={$t.support.contribute} /></p>
	</div>

	<p class="muted small">{$t.support.trademark}</p>
</article>

<style>
	.prose {
		max-width: 34rem;
	}

	.card {
		margin-bottom: 0.75rem;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	li {
		margin-bottom: 0.6rem;
	}

	.give {
		margin-top: 0.85rem;
	}

	.small {
		font-size: 0.8125rem;
	}
</style>
