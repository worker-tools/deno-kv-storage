import { StorageArea, AllowedKey, Key } from 'https://cdn.skypack.dev/kv-storage-interface@^0.2.0/index.d.ts';

import Typeson from 'https://cdn.skypack.dev/typeson@^5.18.2';
import structuredCloningThrowing from 'https://cdn.skypack.dev/typeson-registry/dist/presets/structured-cloning-throwing.js';

import { Adapter, adapters, DBProtocol, DB_URL } from './adapters/mod.ts';
import { throwForDisallowedKey } from './common.ts';
import { encodeKey, decodeKey } from './key-encoding.ts';

const DEFAULT_URL_KEY = 'DENO_STORAGE_AREA__DEFAULT_URL';
const DEFAULT_STORAGE_AREA_NAME = 'default';

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
const TSON = (new Typeson() as any).register(structuredCloningThrowing);
const encodeValue = (d: any) => JSON.stringify(TSON.encapsulate(d));
const decodeValue = (s?: string) => s && TSON.revive(JSON.parse(s));

export interface DenoStorageAreaOptions {
  url?: DB_URL
  [k: string]: any,
}

export class DenoStorageArea implements StorageArea {
  #adapter: Adapter;

  static defaultURL?: DB_URL

  constructor(name: string = DEFAULT_STORAGE_AREA_NAME, { url }: DenoStorageAreaOptions = {}) {
    const dbURL = url
      || DenoStorageArea.defaultURL
      || Reflect.get(self, DEFAULT_URL_KEY)
      || Deno.env.get(DEFAULT_URL_KEY)
      || 'sqlite://';

    const x = new URL(dbURL);
    const protocol = x.protocol as DBProtocol;
    const AdapterCtor = adapters.get(protocol);

    if (!AdapterCtor) {
      throw Error(`Adapter for database protocol '${protocol}' not registered. Try importing '@worker-tools/deno-kv-storage/adapters/${protocol.replace(':', '')}.ts'`);
    }

    this.#adapter = new AdapterCtor({ area: name, url: dbURL });
  }

  async get<T>(key: AllowedKey): Promise<T | undefined> {
    throwForDisallowedKey(key);
    return decodeValue(await this.#adapter.get(encodeKey(key)));
  }

  async set<T>(key: AllowedKey, value: T | undefined): Promise<void> {
    throwForDisallowedKey(key);
    if (value === undefined) {
      await this.#adapter.delete(encodeKey(key));
    } else {
      await this.#adapter.set(encodeKey(key), encodeValue(value));
    }
  }

  async delete(key: AllowedKey) {
    throwForDisallowedKey(key);
    await this.#adapter.delete(encodeKey(key));
  }

  async clear() {
    await this.#adapter.clear();
  }

  async *keys(): AsyncGenerator<Key> {
    for await (const key of this.#adapter.keys()) {
      yield decodeKey(key);
    }
  }

  async *values<T>(): AsyncGenerator<T> {
    for await (const value of this.#adapter.values()) {
      yield decodeValue(value);
    }
  }

  async *entries<T>(): AsyncGenerator<[Key, T]> {
    for await (const [key, value] of this.#adapter.entries()) {
      yield [decodeKey(key), decodeValue(value)];
    }
  }

  backingStore() {
    return this.#adapter.backingStore();
  }
}

export type { AllowedKey, Key };
export { DenoStorageArea as StorageArea };
