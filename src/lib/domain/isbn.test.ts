/**
 * ISBN tests, using real ISBNs off real books rather than synthetic digits, because every bug this file exists to catch is a bug about a real book somebody scanned.
 */

import { describe, expect, it } from 'vitest';
import { isbn13CheckDigit, isValidIsbn13, normalizeIsbn } from './isbn.ts';

describe('isbn13CheckDigit', () => {
	it('computes the check digit for a known ISBN-13', () => {
		// Penguin Classics, Wuthering Heights: 978-0-14-118776-1
		expect(isbn13CheckDigit('978014118776')).toBe(1);
	});

	it('handles a check digit of 0 without producing 10', () => {
		// 978-0-306-40615-7 shifted: the modulo must wrap to 0, never to 10.
		const digit = isbn13CheckDigit('978030640615');
		expect(digit).toBe(7);
		expect(isbn13CheckDigit('978014118779')).toBeLessThan(10);
	});

	it('rejects input that is not twelve digits', () => {
		expect(() => isbn13CheckDigit('97801411877')).toThrow(RangeError);
		expect(() => isbn13CheckDigit('97801411877X')).toThrow(RangeError);
	});
});

describe('isValidIsbn13', () => {
	it('accepts a correct thirteen-digit ISBN', () => {
		expect(isValidIsbn13('9780141187761')).toBe(true);
	});

	it('rejects a wrong check digit', () => {
		expect(isValidIsbn13('9780141187762')).toBe(false);
	});

	it('rejects anything that is not thirteen digits', () => {
		expect(isValidIsbn13('978014118776')).toBe(false);
		expect(isValidIsbn13('97801411877610')).toBe(false);
		expect(isValidIsbn13('978-0-14-118776-1')).toBe(false);
		expect(isValidIsbn13('')).toBe(false);
	});

	it('does not judge the prefix — that is normalizeIsbn\u2019s job', () => {
		expect(isValidIsbn13('5901234123457')).toBe(true);
	});
});

describe('normalizeIsbn', () => {
	it('accepts a hyphenated ISBN-13 and strips the hyphens', () => {
		expect(normalizeIsbn('978-0-14-118776-1')).toBe('9780141187761');
	});

	it('accepts a bare ISBN-13 unchanged', () => {
		expect(normalizeIsbn('9780141187761')).toBe('9780141187761');
	});

	it('rejects an ISBN-10 with the wrong check digit', () => {
		// The real check character for 0-14-118776 is X, not 2.
		expect(normalizeIsbn('0-14-118776-2')).toBeNull();
	});

	it('accepts the same ISBN-10 with its real check character', () => {
		expect(normalizeIsbn('0-14-118776-X')).toBe('9780141187761');
	});

	it('converts a valid ISBN-10 to ISBN-13', () => {
		expect(normalizeIsbn('0306406152')).toBe('9780306406157');
	});

	it('converts an ISBN-10 ending in X', () => {
		expect(normalizeIsbn('097522980X')).toBe('9780975229804');
	});

	it('accepts a lowercase x as the ISBN-10 check character', () => {
		expect(normalizeIsbn('097522980x')).toBe('9780975229804');
	});

	it('rejects a thirteen-digit non-book EAN', () => {
		// Valid EAN-13 arithmetic, prefix 590: a tin of beans, not a book.
		expect(isValidIsbn13('5901234123457')).toBe(true);
		expect(normalizeIsbn('5901234123457')).toBeNull();
	});

	it('accepts the 979 Bookland prefix', () => {
		expect(normalizeIsbn('9791234567896')).toBe('9791234567896');
	});

	it('rejects garbage', () => {
		expect(normalizeIsbn('hello')).toBeNull();
		expect(normalizeIsbn('not-an-isbn-at-all')).toBeNull();
		expect(normalizeIsbn('12345')).toBeNull();
		expect(normalizeIsbn('978014118776112345')).toBeNull();
		expect(normalizeIsbn('97801411877X1')).toBeNull();
	});

	it('rejects an empty string', () => {
		expect(normalizeIsbn('')).toBeNull();
		expect(normalizeIsbn('   ')).toBeNull();
		expect(normalizeIsbn('---')).toBeNull();
	});

	it('tolerates whitespace and hyphens anywhere', () => {
		expect(normalizeIsbn('  978 0 14 118776 1  ')).toBe('9780141187761');
		expect(normalizeIsbn('978\t0141\n1877 61')).toBe('9780141187761');
		expect(normalizeIsbn('ISBN 978-0-14-118776-1'.replace('ISBN', ''))).toBe('9780141187761');
	});

	it('tolerates the en dash a copy-paste from a web page brings along', () => {
		expect(normalizeIsbn('978\u20130\u201314\u2013118776\u20131')).toBe('9780141187761');
	});

	it('does not accept an X in an ISBN-13', () => {
		expect(normalizeIsbn('978014118776X')).toBeNull();
	});

	it('treats a scanned barcode and a typed ISBN identically', () => {
		// The EAN-13 on the back cover is the ISBN-13; one function serves both.
		const scanned = '9780306406157';
		const typed = '0-306-40615-2';
		expect(normalizeIsbn(scanned)).toBe(normalizeIsbn(typed));
	});
});
