<script lang="ts">
	/**
	 * A badge or ladder-rung token: the coruja mark wearing an emoji. The whole visual system for achievement in this app is this one component — no custom art per badge, which is both the lightweight choice and the consistent one.
	 */
	import Mark from './Mark.svelte';

	let {
		emoji,
		size = 56,
		earned = true
	}: { emoji: string; size?: number; earned?: boolean } = $props();
</script>

<span class="token" class:earned style="width: {size}px; height: {size}px" aria-hidden="true">
	<Mark size={size * 0.55} />
	<span class="emoji" style="font-size: {size * 0.38}px">{emoji}</span>
</span>

<style>
	.token {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		border-radius: 50%;
		/*
		 * Gold, not the brand indigo. Achievement and identity are different things: the
		 * owl in the header is "this app", the owl on a badge is "you did this", and
		 * giving them the same colour made badges read as more logos. --gold-fill was
		 * reserved for exactly this in DESIGN.md; the dark gold keeps the mark's strokes
		 * above the 3:1 graphics floor on it. (A white mark was tried and rejected:
		 * too faint, read as strange rather than engraved.)
		 */
		background: var(--gold-fill);
		color: var(--gold);
	}

	.token:not(.earned) {
		background: var(--bg);
		color: var(--line);
		border: 1px dashed var(--line);
	}

	/* Greyscale the emoji on locked tokens, so earned ones visibly glow by contrast. */
	.token:not(.earned) .emoji {
		filter: grayscale(1);
		opacity: 0.55;
	}

	.emoji {
		position: absolute;
		right: -2%;
		bottom: -4%;
		line-height: 1;
	}
</style>
