// deno-lint-ignore-file no-explicit-any
export interface Adapter {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<readonly [string, string]>;
  backingStore(): unknown;
}

export type DBProtocol = `${string}:`;
export type DB_URL = `${DBProtocol}//${string}`;
export type Class<T = unknown, Arguments extends any[] = any[]> = new(...arguments_: Arguments) => T;
export type AdapterParams = { area: string, url: DB_URL };
export type AdapterClass = Class<Adapter, [AdapterParams]>;

(<any>globalThis).deno_storage_area__adapters ||= new Map<DBProtocol, AdapterClass>();
