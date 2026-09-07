<script lang="ts">
	/*
	 * The honest version. The whole page exists for the one exception: an ISBN lookup
	 * leaves the device, and pretending otherwise would be the only dishonest sentence
	 * in the app. Prerendered in English, swapped on hydration; see about/+page.svelte.
	 */
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>{$t.privacy.title} · coruja</title>
	<meta name="description" content={$t.privacy.metaDescription} />
</svelte:head>

<article class="prose">
	<h1>{$t.privacy.title}</h1>

	<div class="card">
		<p><strong>{$t.privacy.stays}</strong></p>
		<p class="muted">{$t.privacy.staysBody}</p>
	</div>

	<div class="card">
		<h2>{$t.privacy.exceptionTitle}</h2>
		<p>
			{$t.privacy.exceptionBefore}
			<a href="https://openlibrary.org" rel="noopener">Open Library</a>{$t.privacy.exceptionAfter}
		</p>
		<p>{$t.privacy.exception2}</p>
		<p><strong>{$t.privacy.switchOffLead}</strong> {$t.privacy.switchOffBody}</p>
		<p class="muted">{$t.privacy.covers}</p>
	</div>

	<div class="card">
		<h2>{$t.privacy.backupsTitle}</h2>
		<p class="muted">{$t.privacy.backupsBody}</p>
	</div>

	<div class="card">
		<h2>{$t.privacy.hostingTitle}</h2>
		<p class="muted">{$t.privacy.hostingBody}</p>
	</div>

	<div class="card">
		<h2>{$t.privacy.childrenTitle}</h2>
		<p class="muted">{$t.privacy.childrenBody}</p>
	</div>

	<p class="muted small">{$t.privacy.trademarks}</p>
</article>

<style>
	.prose {
		max-width: 34rem;
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

	.small {
		font-size: 0.8125rem;
	}
</style>
