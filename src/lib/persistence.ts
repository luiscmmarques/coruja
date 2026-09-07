/**
 * Durable storage.
 *
 * Everything this app knows lives in one IndexedDB database in one browser profile,
 * and by default that storage is *best-effort*: under disk pressure the browser may
 * evict whole origins, silently. For coruja that would be a family's entire shelf,
 * every reading, every badge, gone with no error and nothing on screen to explain it.
 *
 * `navigator.storage.persist()` asks the browser to take the origin out of the
 * eviction pool. The request waits until the shelf holds at least one book: Chromium
 * decides silently so timing costs nothing there, but Firefox shows a permission
 * prompt, and asking before there is anything to protect spends the one question on
 * nothing (a refusal is remembered). `persisted()` is read first and never prompts,
 * so a returning or reinstalled profile is recognised without asking again.
 *
 * The outcome drives exactly one piece of UI: when the browser has *refused*, the
 * backup card in Setup says so and points at export as the protection. A granted
 * origin and an unsupported browser both show nothing, because there is nothing
 * actionable to say.
 *
 * Adapted from Graftful's persistence module, the sibling project this app mirrors.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
 */

import { browser } from '$app/environment';
import { writable, type Readable } from 'svelte/store';
import { booksStore } from './db';

/**
 * What the browser has said about keeping this data.
 *
 * - `unknown`: not asked yet, or no usable answer. Nothing to report.
 * - `granted`: the origin is persistent; it will not be evicted under pressure.
 * - `refused`: the browser declined. The data can still be evicted.
 * - `unsupported`: no Storage API, so the question cannot be put at all.
 */
export type PersistenceState = 'unknown' | 'granted' | 'refused' | 'unsupported';

/**
 * The slice of `StorageManager` this module uses, as an interface so the logic can be
 * exercised with a stub: there is no browser in the unit suite, and a feature whose
 * only failure mode is silent data loss should not be tested exclusively by hand.
 */
export interface StorageManagerLike {
	persisted(): Promise<boolean>;
	persist(): Promise<boolean>;
}

/**
 * Read whether the origin is already persistent, without asking for anything.
 * A `false` answer reports as `unknown`, not `refused`: not-yet-granted is not the
 * same as declined, and the difference decides whether Setup says anything.
 */
export async function checkPersisted(
	storage: StorageManagerLike | undefined
): Promise<PersistenceState> {
	if (!storage || typeof storage.persisted !== 'function') return 'unsupported';
	try {
		return (await storage.persisted()) ? 'granted' : 'unknown';
	} catch {
		// A rejected promise says nothing about eviction either way; claiming refusal
		// here would put a warning on screen off the back of an unrelated fault.
		return 'unknown';
	}
}

/**
 * Ask the browser to keep this origin, unless it already does. `persisted()` first,
 * so an already-persistent origin is never re-asked, which on Firefox would mean a
 * second permission prompt for a permission already held.
 */
export async function requestPersistence(
	storage: StorageManagerLike | undefined
): Promise<PersistenceState> {
	if (
		!storage ||
		typeof storage.persisted !== 'function' ||
		typeof storage.persist !== 'function'
	) {
		return 'unsupported';
	}
	try {
		if (await storage.persisted()) return 'granted';
		return (await storage.persist()) ? 'granted' : 'refused';
	} catch {
		return 'unknown';
	}
}

/** The real `navigator.storage`, or `undefined` where it does not exist. */
function platformStorage(): StorageManagerLike | undefined {
	if (!browser) return undefined;
	return navigator.storage as StorageManagerLike | undefined;
}

const current = writable<PersistenceState>('unknown');

/**
 * What the browser has said, as a store, so Setup re-renders when the answer
 * arrives. Stays `unknown` on the server, which is what the prerendered content
 * pages need: they render the shared layout where there is no `navigator`.
 */
export const persistence: Readable<PersistenceState> = { subscribe: current.subscribe };

/** Whether the request has been made. At most once a page. */
let asked = false;

/** Request persistence once and publish the outcome. Idempotent. */
export async function ensurePersistence(): Promise<void> {
	if (!browser || asked) return;
	asked = true;
	current.set(await requestPersistence(platformStorage()));
}

/**
 * Watch for the shelf holding a book, then ask. Returns an unsubscribe function for
 * the caller's teardown. On the way in it also reads `persisted()`, which prompts
 * for nothing, so an already-persistent origin is recognised on an empty visit too.
 */
export function watchStoredData(): () => void {
	if (!browser) return () => {};

	void checkPersisted(platformStorage()).then((initial) => {
		// Only ever an upgrade from the starting value: a later ensurePersistence
		// result is the more informed answer and must not be overwritten late.
		if (initial !== 'unknown') current.update((value) => (value === 'unknown' ? initial : value));
	});

	return booksStore.subscribe((books) => {
		if (books && books.length > 0) void ensurePersistence();
	});
}
