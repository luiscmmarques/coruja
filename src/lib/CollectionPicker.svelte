<!--
	The one collection control, used on every book card (compact: emojis) and in the
	edit dialog (full: names). It looks like a dropdown, chevron and all, because it
	is one: a native <select> stretched invisibly over the visible face, so a tap
	opens the OS picker with zero custom menu code. Choosing an option TOGGLES that
	collection: ✓-marked entries are current memberships and choosing one removes it.
	A real select cannot hold "several at once", so the select snaps back to blank
	after every choice and the face tells the truth instead.
-->
<script lang="ts">
	import type { Collection } from '$lib/domain/types';

	let {
		collections,
		selectedIds,
		onToggle,
		label,
		variant = 'compact'
	}: {
		collections: Collection[];
		selectedIds: string[];
		onToggle: (collectionId: string) => void;
		/** Accessible name, and the full variant's empty-state text. */
		label: string;
		variant?: 'compact' | 'full';
	} = $props();

	const selected = $derived(collections.filter((c) => selectedIds.includes(c.id)));

	function choose(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const id = select.value;
		select.value = '';
		if (id) onToggle(id);
	}
</script>

<span class="picker {variant}">
	<span class="face" aria-hidden="true">
		{#if variant === 'full'}
			<span class="text" class:placeholder={selected.length === 0}>
				{selected.length > 0 ? selected.map((c) => `${c.emoji} ${c.name}`).join(', ') : label}
			</span>
		{:else}
			<span class="text">{selected.length > 0 ? selected.map((c) => c.emoji).join('') : '🗂️'}</span>
		{/if}
		<svg class="chevron" viewBox="0 0 10 6" width="10" height="6">
			<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
	</span>
	<select name="collection-assign" aria-label={label} onchange={choose}>
		<option value=""></option>
		{#each collections as c (c.id)}
			<option value={c.id}>{selectedIds.includes(c.id) ? '✓ ' : ''}{c.emoji} {c.name}</option>
		{/each}
	</select>
</span>

<style>
	.picker {
		position: relative;
		display: inline-flex;
		min-height: var(--tap);
	}

	.face {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink-soft);
		font-size: 0.875rem;
	}

	.full {
		width: 100%;
	}

	.full .face {
		border-radius: var(--radius);
		justify-content: space-between;
	}

	.full .text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.placeholder {
		color: var(--ink-soft);
	}

	.chevron {
		flex: none;
	}

	select {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
</style>
