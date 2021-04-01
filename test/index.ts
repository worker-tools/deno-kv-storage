import * as assert from "https://deno.land/std/testing/asserts.ts";

import { StorageArea } from '../mod.ts';
import '../adapters/sqlite.ts';
import '../adapters/postgres.ts';

// Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'sqlite://database.sqlite');
// Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'postgres://qwtel:@localhost:5432/postgres');

Deno.test('create storage area', async () => {
  const storage = new StorageArea();
  assert.assertExists(storage);
  assert.assertEquals(await storage.get(0), undefined);
});

Deno.test('set a key', async () => {
  const storage = new StorageArea();
  await storage.set('test', { a: 3 });
  assert.assertEquals(await storage.get('test'), { a: 3 });
});

Deno.test('set a number key', async () => {
  const storage = new StorageArea();
  await storage.set(3, { f: 8 });
  assert.assertEquals(await storage.get(3), { f: 8 });
});

const d = new Date(0);
Deno.test('set a date key', async () => {
  const storage = new StorageArea();
  await storage.set(d, { c: 5 });
  assert.assertEquals(await storage.get(d), { c: 5 });
});

Deno.test('set a complex key', async () => {
  const storage = new StorageArea();
  await storage.set(['foo', 3, d], { c: 6 });
  assert.assertEquals(await storage.get(['foo', 3, d]), { c: 6 });
});

Deno.test('use multiple storage areas', async () => {
  const other = new StorageArea('other_area');
  await other.set('test', { i: 11 });
  assert.assertEquals(await other.get('test'), { i: 11 });
});

Deno.test('iterate keys', async () => {
  const other = new StorageArea('other_area_2');
  await other.set('test', { i: 11 });
  let ks = []; for await (const k of other.keys()) ks.push(k);
  assert.assertEquals(ks.length, 1);
});

Deno.test('clear', async () => {
  const other = new StorageArea('another_one');
  await other.set('foo', { j: 12 });
  await other.set('bar', { k: 13 });
  await other.clear();
  let ks = []; for await (const k of other.keys()) ks.push(k);
  assert.assertEquals(ks.length, 0);
});

Deno.test('allow bad names', async () => {
  assert.assertEquals(await new StorageArea('[bad-name]').set('a', 3), undefined);
  assert.assertEquals(await new StorageArea('\u{1F602}\u{1F602}\u{1F602}').set('b', 4), undefined);
  assert.assertEquals(await new StorageArea(';DROP TABLE customers;').set('c', 5), undefined);
});
