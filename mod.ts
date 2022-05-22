// deno-lint-ignore-file no-explicit-any
import type { StorageArea, AllowedKey, Key } from 'https://ghuc.cc/qwtel/kv-storage-interface/index.d.ts';
import { encodeKey, decodeKey, throwForDisallowedKey } from 'https://cdn.skypack.dev/idb-key-to-string@^0.2.0?dts';

import { default as typeson } from 'https://cdn.skypack.dev/typeson@7.0.2?dts';
import { structuredCloningThrowing } from 'https://unpkg.com/typeson-registry@3.0.0/dist/index.js';

import { Adapter, adapters, DBProtocol, DB_URL } from './adapters/mod.ts';

const OLD_DEFAULT_URL_KEY = 'DENO_STORAGE_AREA__DEFAULT_URL';
const DEFAULT_URL_KEY = 'DEFAULT_KV_URL';
const DEFAULT_STORAGE_AREA_NAME = 'default';

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = new typeson.Typeson().register([structuredCloningThrowing]);
const encodeValue = (d: any) => JSON.stringify(TSON.encapsulate(d));
const decodeValue = (s?: string) => s && TSON.revive(JSON.parse(s));

export interface DenoStorageAreaOptions {
  url?: DB_URL,
  [k: string]: any,
}

export class DenoStorageArea implements StorageArea {
  #store: Adapter;

  static defaultURL?: DB_URL;

  constructor(name: string = DEFAULT_STORAGE_AREA_NAME, options: DenoStorageAreaOptions = {}) {
    const dbURL = options.url
      || DenoStorageArea.defaultURL
      || Reflect.get(self, DEFAULT_URL_KEY)
      || Reflect.get(self, OLD_DEFAULT_URL_KEY)
      || Deno.env.get(DEFAULT_URL_KEY)
      || Deno.env.get(OLD_DEFAULT_URL_KEY)
      || 'sqlite://';

    const { protocol } = new URL(dbURL);
    const AdapterCtor = adapters.get(protocol as DBProtocol);

    if (!AdapterCtor) {
      throw Error(`Adapter for database protocol '${protocol}' not registered. Try importing 'adapters/${protocol.replace(':', '')}.ts'`);
    }

    this.#store = new AdapterCtor({ area: name, url: dbURL });
  }

  async get<T>(key: AllowedKey): Promise<T | undefined> {
    throwForDisallowedKey(key);
    return decodeValue(await this.#store.get(encodeKey(key)));
  }

  async set<T>(key: AllowedKey, value: T | undefined): Promise<void> {
    throwForDisallowedKey(key);
    if (value === undefined) {
      await this.#store.delete(encodeKey(key));
    } else {
      await this.#store.set(encodeKey(key), encodeValue(value));
    }
  }

  async delete(key: AllowedKey) {
    throwForDisallowedKey(key);
    await this.#store.delete(encodeKey(key));
  }

  async clear() {
    await this.#store.clear();
  }

  async *keys(): AsyncGenerator<Key> {
    for await (const key of this.#store.keys()) {
      yield decodeKey(key);
    }
  }

  async *values<T>(): AsyncGenerator<T> {
    for await (const value of this.#store.values()) {
      yield decodeValue(value);
    }
  }

  async *entries<T>(): AsyncGenerator<[Key, T]> {
    for await (const [key, value] of this.#store.entries()) {
      yield [decodeKey(key), decodeValue(value)];
    }
  }

  backingStore() {
    return this.#store.backingStore();
  }
}

export type { AllowedKey, Key, DBProtocol, DB_URL };
export { DenoStorageArea as StorageArea };
