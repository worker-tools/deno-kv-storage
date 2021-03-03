export interface Store {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, string]>;
}