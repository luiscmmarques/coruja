/**
 * The message catalogue for the locale in force.
 *
 * Read in a component as `$t.today.title`. A store rather than a function call so that changing the language in Setup re-renders every screen without a reload.
 */

import { derived, type Readable } from 'svelte/store';
import type { Locale } from '$lib/domain/locale';
import { locale } from '$lib/locale';
import { de } from './de.ts';
import { en } from './en-source.ts';
import { fr } from './fr.ts';
import { it } from './it.ts';
import { pt } from './pt.ts';
import type { Messages } from './messages.ts';

const CATALOGUE: Record<Locale, Messages> = { en, fr, de, it, pt };

export const t: Readable<Messages> = derived(locale, ($locale) => CATALOGUE[$locale]);

export type { Messages };
