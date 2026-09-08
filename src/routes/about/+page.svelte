<script lang="ts">
	/*
	 * Prerendered, like every route. The prerendered copy is English, because there is
	 * no request to read a language from at build time; it is replaced on hydration by
	 * whatever the reader's browser or their choice in Setup asks for. (Graftful's
	 * pattern, kept.)
	 */
	import SupportButton from '$lib/SupportButton.svelte';
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t.about.title} · coruja</title>
	<meta name="description" content={$t.about.metaDescription} />
</svelte:head>

<article class="prose">
	<h1>{$t.about.title}</h1>

	<div class="card">
		<p>{$t.about.intro}</p>
		<p>{$t.about.introNote}</p>
	</div>

	<div class="card">
		<h2>{$t.about.nameTitle}</h2>
		<p>{$t.about.name1}</p>
		<p>{$t.about.name2}</p>
		<p>{$t.about.name3}</p>
		<p class="muted"><em>{$t.about.pronounce}</em></p>
	</div>

	<div class="card">
		<h2>{$t.about.costsTitle}</h2>
		<p>
			{$t.about.costsBefore}
			<a href="/privacy">{$t.about.costsLink}</a>
			{$t.about.costsAfter}
		</p>
	</div>

	<div class="card">
		<h2>{$t.about.whoTitle}</h2>
		<p class="muted">{$t.about.who1}</p>
		<p class="muted">{$t.about.who2}</p>
		<p class="muted">
			{$t.about.giveBefore}
			<a href="/support">{$t.about.giveLink}</a>
			{$t.about.giveAfter}
		</p>
		<p class="give"><SupportButton label={$t.support.contribute} /></p>
	</div>
</article>

<!-- The same line Setup's footer shows, because a bug report that names its version is answerable — and About is where someone looking for "what am I running" goes first. -->
<footer>
	<p class="muted">{$t.setup.aboutVersion(__APP_VERSION__)}</p>
</footer>

<style>
	/* Prose wants a shorter measure than the app shell's 40rem. */
	.prose {
		max-width: 34rem;
	}

	footer {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.card {
		margin-bottom: 0.75rem;
	}

	.card p {
		margin: 0 0 0.625rem;
	}

	.card p:last-child {
		margin-bottom: 0;
	}

	.give {
		margin-top: 0.85rem;
	}
</style>
