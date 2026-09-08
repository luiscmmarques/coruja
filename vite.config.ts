import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

/**
 * A human-readable build identifier: date plus short commit.
 *
 * Not for caching — content hashes in filenames handle that. It answers "which version is somebody actually running", without which a bug report is unanswerable.
 */
function buildVersion(): string {
	let commit = 'unknown';
	try {
		commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		// No git available. Not worth failing a build over.
	}
	return `${new Date().toISOString().slice(0, 10)}-${commit}`;
}

/**
 * The web app manifest, lifted out of the plugin options so the dev server can serve the same object (the plugin only writes the file during a real build).
 *
 * The icons are SVG. Chromium accepts SVG manifest icons and scales them cleanly; a raster set can be added later without changing anything else here.
 */
const pwaManifest: Partial<ManifestOptions> = {
	name: 'coruja',
	short_name: 'coruja',
	description: 'A family reading tracker and book inventory. Local-first, no account.',
	// The manifest cannot change language at runtime; English is the fallback language.
	lang: 'en',
	theme_color: '#4b3f9e',
	background_color: '#fbfbf9',
	display: 'standalone',
	start_url: '/',
	scope: '/',
	/*
	 * The app identity, stated rather than inferred. With no `id` browsers derive one from `start_url` — which works until that changes, at which point an installed app becomes a second, unrelated entry rather than an update. This value must never change again.
	 */
	id: '/',
	/*
	 * PNG, not the SVGs: Chrome refuses `sizes: 'any'` SVG entries ("failed to load",
	 * "most operating systems require square icons") and installability wants real
	 * square rasters. Rendered from the source SVGs by WebKit (qlmanage), because
	 * ImageMagick's own SVG renderer silently drops the mark; see the favicon commit.
	 * The SVGs stay in static/ for the favicon link and inlining.
	 */
	icons: [
		{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
		{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
		{
			src: '/icons/icon-maskable-192.png',
			sizes: '192x192',
			type: 'image/png',
			purpose: 'maskable'
		},
		{
			src: '/icons/icon-maskable-512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable'
		}
	]
};

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(buildVersion())
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			/*
			 * SvelteKit registers `src/service-worker.ts` itself at a versioned URL while the app registers the same worker at its plain URL. Two registrations in one scope replace each other and the precache can end up never completing — offline breaks while DevTools shows a healthy worker. So SvelteKit's own registration is off, and src/lib/registerServiceWorker.ts does it once.
			 */
			serviceWorker: { register: false },
			/*
			 * Inline each page's CSS into its prerendered HTML (every file is under 6 KB).
			 * On a phone connection the render-blocking stylesheet fetch was the whole
			 * first-paint story: Lighthouse showed a blank screen for two simulated-4G
			 * round trips waiting on CSS the HTML could have carried. Kit hashes the
			 * inlined styles into the CSP below.
			 */
			inlineStyleThreshold: 8192,
			/*
			 * The fallback is named 404.html on purpose: Cloudflare Pages serves a file of that name with a 404 status. With no fallback, Pages serves index.html with a 200 for anything it cannot match — so `/.env` probes read as confirmations and count as page views. `fallback: 'index.html'` would be worse still: it would overwrite the prerendered root with a contentless shell.
			 *
			 * Offline is deliberately different: the service worker answers unmatched navigations with the cached `/`.
			 */
			/*
			 * The CSP is generated here rather than hand-written in static/_headers, because SvelteKit's prerendered pages carry an inline bootstrap script whose content changes every build — only generated hashes can allow it. Emitted into a <meta> tag per page, which also means the policy is enforced under `vite preview` and therefore testable locally.
			 *
			 * `connect-src` lists the two lookup providers: the ISBN lookup is the only network request this app makes, and the policy is the enforcement of that claim — anything else attempting to phone home is blocked by the browser. Open Library is primary; Google Books (returned in v1.1 with a referrer-restricted key, off by default in Setup) is the gap-filler, and its two origins are the JSON endpoint and the cover thumbnails.
			 */
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					/*
					 * 'wasm-unsafe-eval' is required by Chromium and Safari to instantiate a fetched WebAssembly module — without it the scanner's zxing fallback on Safari and Firefox fails with a CSP error. It permits wasm compilation only, not JS eval.
					 */
					'script-src': ['self', 'wasm-unsafe-eval'],
					/*
					 * The Internet Archive origins are the covers' real home: Open Library IS
					 * the Internet Archive, and covers.openlibrary.org answers with a 302 to
					 * archive.org, which 302s again to a storage node like
					 * ia600502.us.archive.org (verified live). Fetch redirects must satisfy
					 * connect-src too, so without these two entries every cover download dies
					 * at the first hop. Same non-profit; the privacy page says so.
					 *
					 * Google's thumbnails serve directly from books.google.com with no
					 * redirect (verified live), so no wildcard sibling is needed there.
					 */
					'connect-src': [
						'self',
						'https://openlibrary.org',
						'https://covers.openlibrary.org',
						'https://archive.org',
						'https://*.archive.org',
						'https://www.googleapis.com',
						'https://books.google.com'
					],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['none']
				}
			},
			adapter: adapter({ fallback: '404.html' })
		}),
		/*
		 * Serve the manifest in dev. `devOptions.enabled` stays off because it would also serve a service worker in dev, which caches the dev server — a reliable way to spend an hour wondering why an edit has not appeared.
		 */
		{
			name: 'coruja:dev-manifest',
			apply: 'serve',
			configureServer(server) {
				server.middlewares.use('/manifest.webmanifest', (_request, response) => {
					response.setHeader('Content-Type', 'application/manifest+json');
					response.end(JSON.stringify(pwaManifest));
				});
			}
		},
		SvelteKitPWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			/*
			 * autoUpdate, not prompt: there is no update UI, and because asset filenames are hashed, an old worker left in charge serves URLs that stop existing the moment a new version deploys. Silently pinning people to a broken version is the worse failure.
			 */
			registerType: 'autoUpdate',
			// Registered explicitly from the app — see src/lib/registerServiceWorker.ts.
			injectRegister: null,
			// Off in dev; test offline against `npm run preview`, which serves a real build.
			devOptions: { enabled: false },
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,wasm}'],
				/*
				 * The lockups exist for the README and printed things; no screen in the app renders them, so precaching them would inflate every install for nothing.
				 */
				globIgnores: ['**/lockup*'],
				// zxing-wasm's decoder is ~1 MB; the default 2 MB cap would drop it from the precache and the scanner fallback would break offline.
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
			},
			manifest: pwaManifest
		})
	],
	test: {
		// The domain suite asserts with node:assert/strict rather than expect(), which keeps src/lib/domain free of test-framework imports.
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
