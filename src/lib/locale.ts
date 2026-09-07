/**
 * Which language to produce.
 *
 * Follows the device by default and can be overridden in Setup. Following the device is the right default because a child opening the app for the first time should see her own language without being asked a question first. The override matters too: a household can run an English phone and still want the shelf in French, or the other way round.
 *
 * Two languages exist, English and French, both complete. Anything else falls back to English rather than guessing, because a half-understood interface is worse than a foreign one you can at least read consistently.
 *
 * ## What this changes
 *
 * Every screen, which reads its copy from `src/lib/i18n`, and the ladder rung names and badge labels — and badge labels are snapshotted at earn time, so the language in force when a badge is earned is the language that badge keeps for ever.
 */

import { browser } from '$app/environment';
import { derived, type Readable } from 'svelte/store';
import { settingsStore } from './db';
import { detectLocale, type Locale } from './domain/locale.ts';

export { type Locale, LOCALES } from './domain/locale.ts';

/**
 * The locale the device asks for, ignoring any saved override.
 *
 * Exported because Setup's "Follow my device" option names the language it would fall back to. Reading the locale in force there would name the override instead, which is the one thing that option is not.
 */
export function browserLocale(): Locale {
	if (!browser) return 'en';
	const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
	return detectLocale(candidates);
}

/** The locale in force: the saved override if there is one, otherwise the device's. */
export const locale: Readable<Locale> = derived(
	settingsStore,
	($settings) => $settings?.locale ?? browserLocale()
);

/**
 * Keep `<html lang>` in step.
 *
 * Not cosmetic: it is what a screen reader uses to choose pronunciation, which matters when the shelf holds books in both languages and a child is listening rather than reading.
 */
if (browser) {
	locale.subscribe((value) => {
		document.documentElement.lang = value;
	});
}
