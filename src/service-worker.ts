/// <reference lib="webworker" />
/**
 * Service worker.
 *
 * `injectManifest` replaces `self.__WB_MANIFEST` with the build's precache list. That substitution only happens in a real build, so everything that depends on it is guarded: without the guard the whole script throws on evaluation, the registration fails, and none of the handlers below are installed either.
 */

import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	precacheAndRoute
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST?: Array<{ url: string; revision: string | null }>;
};

/*
 * Take over as soon as possible rather than waiting for every tab to close.
 *
 * Asset filenames are hashed, so the files a previous worker precached stop existing the moment a new version is deployed — leaving the old worker in charge means it serves URLs that now 404. Replacing it promptly is the safer failure mode. It also matters on first visit: without claiming, the first load leaves the page uncontrolled, and losing signal before navigating again means nothing was cached.
 */
clientsClaim();

const manifest = self.__WB_MANIFEST;

if (Array.isArray(manifest) && manifest.length > 0) {
	precacheAndRoute(manifest);
	cleanupOutdatedCaches();

	/*
	 * Fallback for a path with no prerendered shell of its own — a typo, or a route added since this worker was cached. Every real route has its own shell (see src/routes/+layout.ts), so this is the exception rather than the mechanism.
	 *
	 * Bound to the precached copy rather than fetching, so a stale shell is not served after an update. Guarded because `createHandlerBoundToURL` throws if the URL is not in the manifest, and a throw out here would take the whole worker down.
	 */
	try {
		registerRoute(new NavigationRoute(createHandlerBoundToURL('/')));
	} catch {
		// '/' missing from the manifest: navigation fallback is lost, assets still cached.
	}
}

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
