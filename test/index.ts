import * as assert from "https://deno.land/std/testing/asserts.ts";

import { StorageArea } from '../mod.ts';
import '../adapters/sqlite.ts';

Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'sqlite://database.sqlite');

const storage = new StorageArea();

await storage.set('test', { a: 3 });
assert.assertEquals(await storage.get('test'), { a: 3 });

// Also allows Number keys
await storage.set(3, { f: 8 });
assert.assertEquals(await storage.get(3), { f: 8 });

// Also allows Date keys
const d = new Date(0);
await storage.set(d, { c: 5 });
assert.assertEquals(await storage.get(d), { c: 5 });

// Also allows complex keys
await storage.set(['foo', 3, d], { c: 6 });
assert.assertEquals(await storage.get(['foo', 3, d]), { c: 6 });

// Use multiple storage areas
const other = new StorageArea('other_area');
await other.set('test', { i: 11 });
assert.assertEquals(await other.get('test'), { i: 11 });

// Allow updates
await other.set('test', { i: 12 });
assert.assertEquals(await other.get('test'), { i: 12 });
assert.assertEquals(await storage.get('test'), { a: 3 });

let ks: any[];
ks = []; for await (const k of other.keys()) ks.push(k);
assert.assertEquals(ks.length, 1);

await other.clear();
ks = []; for await (const k of other.keys()) ks.push(k);
assert.assertEquals(ks.length, 0);

// Allow bad names
assert.assertExists(new StorageArea('[bad-name]').set('a', 3));
assert.assertExists(new StorageArea('\u{1F602}\u{1F602}\u{1F602}').set('b', 4));
assert.assertExists(new StorageArea(';DROP TABLE customers;').set('c', 5));