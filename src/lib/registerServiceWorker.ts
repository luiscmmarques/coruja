import { dev } from '$app/environment';

/**
 * Service worker registration.
 *
 * Skipped in dev: the plugin runs with `devOptions: { enabled: false }`, so the dev server serves an ES-module stub at this path that fails to register as a classic script.
 *
 * Plain `navigator.serviceWorker.register`, deliberately, rather than vite-pwa's `virtual:pwa-register` helper or its `injectRegister` option: both expect to add a script tag to built HTML, which never reaches SvelteKit's prerendered output — the file ships, referenced by nothing, while SvelteKit's own automatic registration makes DevTools show a healthy worker that precaches nothing. (Graftful paid for this lesson; see its registerServiceWorker.ts.)
 */
export async function registerServiceWorker(): Promise<void> {
	if (dev || !('serviceWorker' in navigator)) return;

	try {
		await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
	} catch (error) {
		// Not fatal: the app still works online, it just loses offline support.
		console.warn('[coruja] Service worker registration failed', error);
	}
}
