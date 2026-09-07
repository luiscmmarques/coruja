/**
 * ISBN normalisation and validation. Depends on nothing — not even ./types.ts — so it is the cheapest thing in the app to test and the first thing a scan touches.
 *
 * ## One canonical form
 *
 * Everything in the app stores ISBN-13, thirteen digits, no hyphens. ISBN-10 is accepted at the door and converted immediately, so no downstream code ever has to ask which flavour it is holding: two spellings of the same book cannot become two rows on the shelf.
 *
 * ## The barcode is the ISBN
 *
 * The EAN-13 barcode printed on a modern book *is* its ISBN-13 — same thirteen digits, same check digit algorithm. So a camera scan and a typed ISBN go through `normalizeIsbn` unchanged, and there is no separate barcode path to keep in sync. The consequence is that a non-book EAN — a tin of beans, a loyalty card — is a valid EAN-13 and must still be rejected. That is what the prefix check is for: the Bookland prefixes are 978 and 979, and everything else is somebody else's barcode.
 */

/**
 * The ISBN-13 check digit for the first twelve digits: digits are weighted 1 and 3 alternately, and the check digit is whatever brings the total to a multiple of ten.
 *
 * Throws `RangeError` if `first12` is not exactly twelve digits — callers that might be holding arbitrary input should go through `normalizeIsbn` or `isValidIsbn13` instead.
 */
export function isbn13CheckDigit(first12: string): number {
	if (!/^\d{12}$/.test(first12)) {
		throw new RangeError('isbn13CheckDigit expects exactly 12 digits');
	}
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = first12.charCodeAt(i) - 48;
		sum += i % 2 === 0 ? digit : digit * 3;
	}
	return (10 - (sum % 10)) % 10;
}

/**
 * Whether `digits` is thirteen digits with a correct check digit. Deliberately does
 * *not* check the 978/979 prefix: this is arithmetic, and "is it a book" is a separate
 * question answered by `normalizeIsbn`.
 */
export function isValidIsbn13(digits: string): boolean {
	if (!/^\d{13}$/.test(digits)) return false;
	return isbn13CheckDigit(digits.slice(0, 12)) === digits.charCodeAt(12) - 48;
}

/**
 * The ISBN-10 check character: digits weighted 10 down to 1 must sum to a multiple of eleven, which needs eleven possible check values, which is why the last one can be X.
 */
function isValidIsbn10(chars: string): boolean {
	if (!/^\d{9}[\dX]$/.test(chars)) return false;
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += (10 - i) * (chars.charCodeAt(i) - 48);
	}
	sum += chars[9] === 'X' ? 10 : chars.charCodeAt(9) - 48;
	return sum % 11 === 0;
}

/** Separators a human or a label might use: spaces, tabs, and the hyphen family. */
const SEPARATORS = /[\s\u00ad\u2010\u2011\u2012\u2013\u2014\u2015-]+/g;

/**
 * Accept anything that is really an ISBN and return it as thirteen digits; return `null` for everything else. Never throws, never guesses, never repairs a bad check digit — a typo is a rejection, because silently storing the wrong book is worse than asking the user to look again.
 *
 * Accepts, tolerating hyphens and whitespace anywhere:
 * - ISBN-10 with a valid check character (including `X`), converted by prefixing 978
 *   and recomputing the check digit;
 * - ISBN-13 / book EAN-13 with a valid check digit, but only under prefix 978 or 979.
 */
export function normalizeIsbn(raw: string): string | null {
	if (typeof raw !== 'string') return null;
	const cleaned = raw.replace(SEPARATORS, '').toUpperCase();

	if (cleaned.length === 10) {
		if (!isValidIsbn10(cleaned)) return null;
		// The 978 prefix plus the original first nine digits; the ISBN-10 check character is discarded, because the weighting is different.
		const first12 = `978${cleaned.slice(0, 9)}`;
		return `${first12}${isbn13CheckDigit(first12)}`;
	}

	if (cleaned.length === 13) {
		if (!isValidIsbn13(cleaned)) return null;
		const prefix = cleaned.slice(0, 3);
		if (prefix !== '978' && prefix !== '979') return null;
		return cleaned;
	}

	return null;
}
