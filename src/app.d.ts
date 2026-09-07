/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite/client" />
// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	/**
	 * Build identifier, injected by vite.config.ts. Date plus short commit.
	 *
	 * Declared inside `declare global` deliberately: at the top level of a file that has imports it would be module-scoped, and Svelte components would not see it.
	 */
	const __APP_VERSION__: string;

	namespace App {
		// interface Error {} interface Locals {} interface PageData {} interface PageState {} interface Platform {}
	}
}

export {};
