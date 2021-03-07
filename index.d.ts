import { StorageArea, AllowedKey, Key } from 'kv-storage-interface';

export type DBProtocol = `${string}:`;
export type DB_URL = `${DBProtocol}//${string}`;

export interface DenoStorageAreaOptions {
  url?: DB_URL,
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
