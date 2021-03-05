import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts";

import { Store } from './store.ts';

// TODO: make table name configurable??
const CREATE = 'CREATE TABLE IF NOT EXISTS [kv-storage] (area TEXT, key TEXT, value TEXT, PRIMARY KEY (area, key))';
const GET = 'SELECT value FROM [kv-storage] WHERE key=:key AND area=:area';
const UPSERT = 'INSERT INTO [kv-storage] (area, key, value) VALUES (:area, :key, :value) ON CONFLICT(area, key) DO UPDATE SET value=:value';
const DELETE = 'DELETE FROM [kv-storage] WHERE key=:key AND area=:area';
const CLEAR = 'DELETE FROM [kv-storage] WHERE area=:area';
const KEYS = 'SELECT key FROM [kv-storage] WHERE area=:area';
const VALUES = 'SELECT value FROM [kv-storage] WHERE area=:area';
const ENTRIES = 'SELECT key, value FROM [kv-storage] WHERE area=:area';

export class SQLiteStore implements Store {
  #db: DB;
  #area: string;

  constructor({ area, filename }: { area: string, filename?: string }) {
    this.#area = area;

    const db = this.#db = new DB(['', 'memory'].includes(filename ?? '') ? ':memory:' : filename);
    [...db.query(CREATE)];
  }

  async get(key: string): Promise<string | undefined> {
    return [...this.#db.query(GET, { key, area: this.#area })][0]?.[0];
  }

  async set(key: string, value: string) {
    [...this.#db.query(UPSERT, { key, value, area: this.#area })];
  }

  async delete(key: string) {
    [...this.#db.query(DELETE, { key, area: this.#area })];
  }

  async clear() {
    [...this.#db.query(CLEAR, { area: this.#area })];
  }

  async *keys() {
    for (const [key] of this.#db.query(KEYS, { area: this.#area })) {
      yield key;
    }
  }

  async *values() {
    for (const [value] of this.#db.query(VALUES, { area: this.#area })) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of this.#db.query(ENTRIES, { area: this.#area })) {
      yield [key, value] as [string, string];
    }
  }

  backingStore() {
    return this.#db;
  }
}
