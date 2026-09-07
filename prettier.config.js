/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	// Markdown prose flows as one line per paragraph; editors soft-wrap. The default
	// ('preserve') keeps hand-made hard wraps forever, and Prettier's re-wrapping of
	// inline code spans is unstable enough that `lint` can fail straight after `format`.
	proseWrap: 'never',
	plugins: ['prettier-plugin-svelte'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }]
};

export default config;
