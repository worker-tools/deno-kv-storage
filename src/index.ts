import { StorageArea, AllowedKey, Key } from 'https://cdn.skypack.dev/kv-storage-interface@^0.2.0/index.d.ts';

import Typeson from 'https://cdn.skypack.dev/typeson@^5.18.2';
import structuredCloningThrowing from 'https://cdn.skypack.dev/typeson-registry/dist/presets/structured-cloning-throwing.js';

import { Keydb } from "https://deno.land/x/keydb/sqlite.ts";

import { throwForDisallowedKey } from './common.ts';
import { encodeKey, decodeKey } from './key-encoding.ts';

// // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = (new Typeson() as any).register(structuredCloningThrowing);

export class DenoStorageArea implements StorageArea {
  #db: Keydb;

  constructor(name: string = '') {
    this.#db = new Keydb("sqlite://database.sqlite", { 
      namespace: name,
      serialize: d => JSON.stringify(TSON.encapsulate(d)),
      deserialize: s => TSON.revive(JSON.parse(s)),
    });
  }

  async get<T>(key: AllowedKey): Promise<T | undefined> {
    throwForDisallowedKey(key);
    return this.#db.get(encodeKey(key))
  }

  async set<T>(key: AllowedKey, value: T | undefined): Promise<void> {
    throwForDisallowedKey(key);
    if (value === undefined) {
      await this.#db.delete(encodeKey(key));
    } else {
      await this.#db.set(encodeKey(key), value);
    }
  }

  async delete(key: AllowedKey) {
    throwForDisallowedKey(key);
    this.#db.delete(encodeKey(key));
  }

  async clear() {
    this.#db.clear();
  }

  async *keys(): AsyncGenerator<Key> {
    for (const key of await this.#db.keys()) {
      yield decodeKey(key);
    }
  }

  async *values<T>(): AsyncGenerator<T> {
    for (const key of await this.#db.keys()) {
      yield await this.#db.get(key) as T;
    }
  }

  async *entries<T>(): AsyncGenerator<[Key, T]> {
    for (const key of await this.#db.keys()) {
      yield [decodeKey(key), await this.#db.get(key) as T];
    }
  }

  backingStore() {
    return this.#db;
  }
}
