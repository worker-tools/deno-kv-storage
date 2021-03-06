import { StorageArea, AllowedKey, Key } from 'kv-storage-interface';

export type DB_URI =
  | `sqlite://${string}`
  | `postgres://${string}`

export interface DenoStorageAreaOptions {
  uri?: DB_URI
  [k: string]: any,
}

export class DenoStorageArea implements StorageArea {
  constructor(name: string, options?: DenoStorageAreaOptions);
  get<T>(key: AllowedKey): Promise<T | undefined>;
  set<T>(key: AllowedKey, value: T | undefined): Promise<void>;
  delete(key: AllowedKey): Promise<void>;
  clear(): Promise<void>
  keys(): AsyncIterableIterator<Key>;
  values<T>(): AsyncIterableIterator<T>;
  entries<T>(): AsyncIterableIterator<[Key, T]>;
  backingStore(): unknown;
}

export type { AllowedKey, Key } from 'kv-storage-interface';
export { DenoStorageArea as StorageArea };
