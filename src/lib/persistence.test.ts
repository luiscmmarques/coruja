import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { checkPersisted, requestPersistence, type StorageManagerLike } from './persistence';

/** A StorageManager whose answers are scripted. */
function stub(persisted: boolean | 'throws', persist?: boolean | 'throws'): StorageManagerLike {
	return {
		persisted: () =>
			persisted === 'throws' ? Promise.reject(new Error('no')) : Promise.resolve(persisted),
		persist: () =>
			persist === 'throws' ? Promise.reject(new Error('no')) : Promise.resolve(persist ?? false)
	};
}

describe('checkPersisted', () => {
	it('reports unsupported when there is no storage manager', async () => {
		assert.equal(await checkPersisted(undefined), 'unsupported');
	});

	it('reports granted for an already-persistent origin, without prompting', async () => {
		assert.equal(await checkPersisted(stub(true)), 'granted');
	});

	it('reports unknown, not refused, when not yet granted', async () => {
		// Not-yet-granted is not declined; the difference decides whether Setup speaks.
		assert.equal(await checkPersisted(stub(false)), 'unknown');
	});

	it('reports unknown on a rejected promise', async () => {
		assert.equal(await checkPersisted(stub('throws')), 'unknown');
	});
});

describe('requestPersistence', () => {
	it('reports unsupported when there is no storage manager', async () => {
		assert.equal(await requestPersistence(undefined), 'unsupported');
	});

	it('never re-asks an origin that is already persistent', async () => {
		let asked = false;
		const storage: StorageManagerLike = {
			persisted: () => Promise.resolve(true),
			persist: () => {
				asked = true;
				return Promise.resolve(true);
			}
		};
		assert.equal(await requestPersistence(storage), 'granted');
		assert.equal(asked, false);
	});

	it('reports granted when the browser says yes', async () => {
		assert.equal(await requestPersistence(stub(false, true)), 'granted');
	});

	it('reports refused when the browser says no', async () => {
		assert.equal(await requestPersistence(stub(false, false)), 'refused');
	});

	it('reports unknown when the request itself fails', async () => {
		assert.equal(await requestPersistence(stub(false, 'throws')), 'unknown');
	});
});
