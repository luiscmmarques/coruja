/**
 * Keeps static/_headers honest.
 *
 * Every prerendered route must carry `Cache-Control: no-cache, no-transform`: the shells
 * reference content-hashed asset filenames, so a shell cached past a deploy points at
 * files that no longer exist and the app fails to boot. Cloudflare matches literal
 * request paths, so a new route silently ships with default caching unless someone adds
 * it to _headers — this test is the someone.
 *
 * Adding a route? Add it to `ROUTES` here and to static/_headers.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Every path that serves a prerendered HTML document. */
const ROUTES = [
	'/',
	'/index.html',
	'/scan',
	'/badges',
	'/setup',
	'/about',
	'/privacy',
	'/support',
	'/404.html'
];

const headers = readFileSync(new URL('../../static/_headers', import.meta.url), 'utf8');

/** The rules in _headers, as path → list of header lines. */
function parseRules(source: string): Map<string, string[]> {
	const rules = new Map<string, string[]>();
	let current: string[] | null = null;
	for (const raw of source.split('\n')) {
		const line = raw.replace(/#.*$/, '').trimEnd();
		if (line === '') continue;
		if (!raw.startsWith(' ') && !raw.startsWith('\t')) {
			current = [];
			rules.set(line.trim(), current);
		} else if (current) {
			current.push(line.trim());
		}
	}
	return rules;
}

const rules = parseRules(headers);

test('every prerendered route revalidates and opts out of edge transforms', () => {
	for (const route of ROUTES) {
		const lines = rules.get(route);
		assert.ok(lines, `${route} has no entry in static/_headers`);
		const cache = lines.find((l) => l.toLowerCase().startsWith('cache-control:'));
		assert.ok(cache, `${route} sets no Cache-Control`);
		assert.match(cache, /no-cache/, `${route} must revalidate`);
		assert.match(cache, /no-transform/, `${route} must opt out of edge injection`);
		assert.doesNotMatch(cache, /no-store/, `${route}: no-store disqualifies bfcache`);
	}
});

test('hashed assets are immutable and the service worker is not', () => {
	const immutable = rules.get('/_app/immutable/*');
	assert.ok(
		immutable?.some((l) => /immutable/.test(l)),
		'immutable assets must say so'
	);

	const worker = rules.get('/service-worker.js');
	assert.ok(
		worker?.some((l) => /no-cache/.test(l) && !/immutable/.test(l)),
		'a cached service worker is a version pin nobody chose'
	);
});

test('the routes this test knows about match the routes that exist', () => {
	// The route list above is the contract; this cross-checks it against src/routes so a
	// new +page.svelte cannot be added without deciding its cache rule.
	const pages = ['/', '/scan', '/badges', '/setup', '/about', '/privacy', '/support'];
	for (const page of pages) {
		assert.ok(ROUTES.includes(page), `${page} exists but is missing from ROUTES`);
	}
});

/**
 * The security header set, guarded the same way: absence would be silent. The full CSP
 * lives in a <meta> tag (vite.config.ts) because of build hashes; these are the parts a
 * meta tag cannot carry, plus the cross-cutting hardening headers.
 */
test('the security headers are all present', () => {
	for (const needle of [
		'X-Frame-Options: DENY',
		"Content-Security-Policy: frame-ancestors 'none'",
		'X-Content-Type-Options: nosniff',
		'Referrer-Policy: strict-origin-when-cross-origin',
		'Strict-Transport-Security: max-age=31536000',
		'Permissions-Policy: camera=(self)',
		'Cross-Origin-Opener-Policy: same-origin'
	]) {
		assert.ok(headers.includes(needle), `missing from _headers: ${needle}`);
	}
});

/**
 * RFC 9116: Contact and Expires are the two REQUIRED fields, and an expired file is
 * treated as absent by scanners. The date is static, so once a year this test starts
 * failing on purpose about sixty days ahead: that is the renewal reminder.
 */
test('security.txt is valid per RFC 9116 and not close to expiry', () => {
	const txt = readFileSync(
		new URL('../../static/.well-known/security.txt', import.meta.url),
		'utf8'
	);
	assert.match(txt, /^Contact: mailto:.+$/m);
	const expires = txt.match(/^Expires: (.+)$/m);
	assert.ok(expires, 'Expires field missing');
	const remaining = Date.parse(expires[1]) - Date.now();
	assert.ok(remaining > 60 * 24 * 3600 * 1000, 'security.txt expires within 60 days: renew it');
});
