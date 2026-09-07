/**
 * Languages the app produces text in.
 *
 * Two, both complete at launch: English and French. English is the source that defines the message type; French must satisfy it, so a half-translated language cannot ship. Portuguese is wanted later, and adding it means adding a code here and a catalogue file — nothing else.
 *
 * Base language codes rather than regional tags, matched against the browser by base language, and the wording is international rather than tied to one country: the French reads the same in Lyon, Lausanne or Liège. A child's book is not a Swiss object.
 *
 * Kept in the domain because it has no dependencies at all, which keeps it usable from the backup format, from the badge catalogue, and from plain node under vitest.
 */
export type Locale = 'en' | 'fr' | 'de' | 'it' | 'pt';

export const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
	{ value: 'en', label: 'English' },
	{ value: 'fr', label: 'Français' },
	{ value: 'de', label: 'Deutsch' },
	{ value: 'it', label: 'Italiano' },
	{ value: 'pt', label: 'Português (Portugal)' }
];

/**
 * The locale implied by a list of browser languages, in preference order.
 *
 * The first supported entry wins, so a browser set to `['fr-CH', 'en']` gets French — the user's own first choice — rather than falling through. Regional tags collapse to the base language, so fr-CH and fr-CA both get the same French. Anything unsupported falls back to English rather than guessing at something geographically close.
 */
export function detectLocale(candidates: readonly string[]): Locale {
	const supported = new Set<string>(['en', 'fr', 'de', 'it', 'pt']);

	for (const candidate of candidates) {
		const base = candidate.toLowerCase().split('-')[0];
		if (supported.has(base)) return base as Locale;
	}

	return 'en';
}
