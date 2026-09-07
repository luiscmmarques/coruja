/**
 * The family PIN — a child lock, and honestly only that.
 *
 * It gates switching to an adult profile, which is what hides adult-marked books. The
 * threat model is a curious eight-year-old with the family phone, not an attacker:
 * the data is in her own household's IndexedDB, so anything stronger than a lock on
 * the profile switcher would be theatre. The PIN is still stored as a salted SHA-256
 * hash rather than plaintext, because backups are files people email themselves, and
 * a family's PIN is often a birth year or a door code reused from real life — the
 * hash keeps a leaked backup from leaking that.
 *
 * `crypto.subtle` exists in every target browser and in node ≥ 20, so this stays in
 * the dependency-free domain and is testable without mocks.
 */

/** Domain-separates the hash so it matches nothing else hashed from the same string. */
const PIN_SALT = 'coruja-family-pin:';

export async function hashPin(pin: string): Promise<string> {
	const bytes = new TextEncoder().encode(PIN_SALT + pin.trim());
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function pinMatches(pin: string, storedHash: string): Promise<boolean> {
	return (await hashPin(pin)) === storedHash;
}

/** Four to eight digits: long enough to not be guessed in three tries at the sofa, short enough for a parent to remember. */
export function isValidPin(pin: string): boolean {
	return /^\d{4,8}$/.test(pin.trim());
}
