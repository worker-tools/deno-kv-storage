import { StorageArea, AllowedKey, Key } from 'https://cdn.skypack.dev/kv-storage-interface@^0.2.0/index.d.ts';

import Typeson from 'https://cdn.skypack.dev/typeson@^5.18.2';
import structuredCloningThrowing from 'https://cdn.skypack.dev/typeson-registry/dist/presets/structured-cloning-throwing.js';

import { Store, storeRepository, DBProtocol, DB_URI } from './store.ts';
import { throwForDisallowedKey } from './common.ts';
import { encodeKey, decodeKey } from './key-encoding.ts';

const DEFAULT_URI_KEY = 'DENO_STORAGE_AREA__DEFAULT_URI';
const DEFAULT_STORAGE_AREA_NAME = 'default';

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = (new Typeson() as any).register(structuredCloningThrowing);
const encodeValue = (d: any) => JSON.stringify(TSON.encapsulate(d));
const decodeValue = (s?: string) => s && TSON.revive(JSON.parse(s));

export interface DenoStorageAreaOptions {
  uri?: DB_URI
  [k: string]: any,
}

export class DenoStorageArea implements StorageArea {
  #store: Store;

  static defaultURI: DB_URI

  constructor(name: string = DEFAULT_STORAGE_AREA_NAME, { uri }: DenoStorageAreaOptions = {}) {
    const dbURI = uri 
      || DenoStorageArea.defaultURI
      || Reflect.get(self, DEFAULT_URI_KEY) as DB_URI
      || 'sqlite://';

    const x = new URL(dbURI);
    const protocol = x.protocol as DBProtocol;
    const StoreCtor = storeRepository.get(protocol);

    if (!StoreCtor) {
      throw Error(`Adapter for database protocol '${protocol}' not registered. Try importing '@worker-tools/deno-kv-storage/src/${protocol.replace(':', '')}-store.ts'`);
    }

    this.#store = new StoreCtor({ area: name, uri: dbURI });
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

export { DenoStorageArea as StorageArea };
