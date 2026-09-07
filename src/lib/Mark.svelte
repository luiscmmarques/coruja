<script lang="ts">
	/**
	 * The coruja mark, inlined.
	 *
	 * `?raw` imports the generated src/lib/assets/mark.svg (a build-emitted twin of static/mark.svg) — the file scripts/build-marks.mjs writes from the single-source geometry in scripts/mark.mjs — so this component can never drift from the real mark. Inlined rather than an <img> because mark.svg uses `currentColor`, which only inherits when the SVG is part of the document.
	 */
	import markSvg from '$lib/assets/mark.svg?raw';

	let { size = 24 }: { size?: number } = $props();
</script>

<span class="mark" style="width: {size}px; height: {size}px" aria-hidden="true">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- build-generated asset, not user input -->
	{@html markSvg}
</span>

<style>
	.mark {
		display: inline-block;
		flex: none;
		line-height: 0;
	}

	.mark :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
