import * as assert from "https://deno.land/std/testing/asserts.ts";
import { concatUint8Arrays } from 'https://cdn.skypack.dev/typed-array-utils?dts';

import { StorageArea } from '../mod.ts';
import '../adapters/sqlite.ts';
import '../adapters/postgres.ts';
import '../adapters/_mysql.ts';

// Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'sqlite://database.sqlite');
// Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'postgres://deno:node@localhost:5432/test');
// Reflect.set(self, 'DENO_STORAGE_AREA__DEFAULT_URL', 'mysql://root:@127.0.0.1/test');

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
  await other.set('fest', { i: 12 });
  let ks = []; for await (const k of other.keys()) ks.push(k);
  assert.assertEquals(ks.length, 2);
  assert.assertEquals(new Set(ks), new Set(['fest', 'test']));
});

Deno.test('clear', async () => {
  const other = new StorageArea('another_one');
  await other.set('foo', { j: 12 });
  await other.set('bar', { k: 13 });
  await other.clear();
  let ks = []; for await (const k of other.keys()) ks.push(k);
  assert.assertEquals(ks.length, 0);
  assert.assertEquals(ks, []);
});

Deno.test('allow utf8 values', async () => {
  const storage = new StorageArea();
  await storage.set('xx', '\u{1F602}\u{1F602}\u{1F602}')
  assert.assertEquals(await storage.get('xx'), '\u{1F602}\u{1F602}\u{1F602}');
  await storage.set('xy', { a: '\u{1F602}\u{1F602}\u{1F602}' })
  assert.assertEquals(await storage.get('xy'), { a: '\u{1F602}\u{1F602}\u{1F602}' });
});

Deno.test('allow bad names', async () => {
  assert.assertEquals(await new StorageArea('[bad-name]').set('a', 3), undefined);
  assert.assertEquals(await new StorageArea(';DROP TABLE customers;').set('c', 5), undefined);
  assert.assertEquals(await new StorageArea('\u{1F602}\u{1F602}\u{1F602}').set('b', 4), undefined);
});

Deno.test('accepts at least 255 bytes per key', async () => {
  const storage = new StorageArea();
  const k = crypto.getRandomValues(new Uint8Array(255));
  await storage.set(k, true);
  assert.assertEquals(await storage.get(k), true);
});

Deno.test('accepts larger keys', async () => {
  const storage = new StorageArea();
  const k = crypto.getRandomValues(new Uint8Array(1024));
  await storage.set(k, true);
  assert.assertEquals(await storage.get(k), true);
});

function make16MB() {
  const u8s = [];
  for (let i = 0; i < 256; i++) u8s.push(crypto.getRandomValues(new Uint8Array(65536)));
  return concatUint8Arrays(...u8s);
}

Deno.test('write/read 16 MB', async () => {
  const storage = new StorageArea();
  const data = make16MB();
  await storage.set('data', data);
  assert.assertEquals((await storage.get<Uint8Array>('data'))?.byteLength, data.byteLength);
});

// Deno.test('accepts largest keys', async () => {
//   const storage = new StorageArea();
//   const data = crypto.getRandomValues(new Uint8Array(65536));
//   await storage.set(data, true);
//   assert.assertEquals(await storage.get(data), true);
// });
