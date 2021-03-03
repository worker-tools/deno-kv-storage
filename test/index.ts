import * as assert from "https://deno.land/std/testing/asserts.ts";

import { DenoStorageArea } from '../src/mod.ts';

(async () => {
  const storage = new DenoStorageArea('storage', { uri: 'sqlite://' });

  await storage.set('test', { a: 3 })
  assert.assertEquals(await storage.get('test'), { a: 3 })

  // Also allows Number keys
  await storage.set(3, { f: 8 })
  assert.assertEquals(await storage.get(3), { f: 8 })

  // Also allows Date keys
  const d = new Date(0)
  await storage.set(d, { c: 5 })
  assert.assertEquals(await storage.get(d), { c: 5 })

  // Also allows complex keys
  await storage.set(['foo', 3, d], { c: 6 })
  assert.assertEquals(await storage.get(['foo', 3, d]), { c: 6 })

  // Use multiple storage areas
  const other = new DenoStorageArea('otherarea')
  await other.set('test', { i: 11 })
  assert.assertEquals(await other.get('test'), { i: 11 })
})();