<script lang="ts">
	/**
	 * A book cover, from the local blob store. Covers are fetched once at enrichment and stored in IndexedDB, so the shelf renders offline; this component only ever reads the local copy. Falls back to a spine-coloured placeholder with no image.
	 */
	import { db } from '$lib/db';

	let { coverId, title }: { coverId?: string; title: string } = $props();

	let url = $state<string | null>(null);

	$effect(() => {
		let revoked: string | null = null;
		url = null;
		if (coverId) {
			void db.covers.get(coverId).then((row) => {
				if (row) {
					revoked = URL.createObjectURL(row.blob);
					url = revoked;
				}
			});
		}
		return () => {
			if (revoked) URL.revokeObjectURL(revoked);
		};
	});
</script>

{#if url}
	<img src={url} alt="" loading="lazy" />
{:else}
	<span class="placeholder" aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>
{/if}

<style>
	img,
	.placeholder {
		width: 3rem;
		height: 4.25rem;
		border-radius: 0.25rem;
		object-fit: cover;
		flex: none;
	}

	.placeholder {
		display: grid;
		place-items: center;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 700;
		font-size: 1.25rem;
	}
</style>
