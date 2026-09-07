import assert from 'node:assert/strict';
import { test } from 'vitest';
import { hashPin, isValidPin, pinMatches } from './pin.ts';

test('a PIN matches its own hash and nothing else', async () => {
	const hash = await hashPin('2468');
	assert.equal(await pinMatches('2468', hash), true);
	assert.equal(await pinMatches('2469', hash), false);
	assert.equal(await pinMatches('', hash), false);
});

test('the hash is salted: it is not the bare SHA-256 of the digits', async () => {
	// SHA-256("2468") — what a rainbow table of four-digit PINs would contain.
	const bare = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('2468'));
	const bareHex = [...new Uint8Array(bare)].map((b) => b.toString(16).padStart(2, '0')).join('');
	assert.notEqual(await hashPin('2468'), bareHex);
});

test('whitespace around the PIN is forgiven — a phone keyboard adds it uninvited', async () => {
	const hash = await hashPin('2468');
	assert.equal(await pinMatches(' 2468 ', hash), true);
});

test('four to eight digits, nothing else', () => {
	assert.equal(isValidPin('2468'), true);
	assert.equal(isValidPin('12345678'), true);
	assert.equal(isValidPin('123'), false);
	assert.equal(isValidPin('123456789'), false);
	assert.equal(isValidPin('12a4'), false);
	assert.equal(isValidPin(''), false);
});
