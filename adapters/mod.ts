export interface Adapter {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, string]>;
  backingStore(): unknown;
}

export type DBProtocol =
  | `sqlite:`
  | `postgres:`;

export type DB_URI =
  | `sqlite://${string}` 
  | `postgres://${string}`

export type Class<T = unknown, Arguments extends any[] = any[]> = new(...arguments_: Arguments) => T;
export const adapters = new Map<DBProtocol, Class<Adapter, [{ area: string, uri: DB_URI }]>>();