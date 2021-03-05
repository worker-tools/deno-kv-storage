import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts";

import { Store } from './store.ts';

export class SQLiteStore implements Store {
  #db: DB;
  #area: string;

  constructor({ area, filename }: { area: string, filename?: string }) {
    this.#area = area;

    const db = this.#db = new DB(['', 'memory'].includes(filename ?? '') ? ':memory:' : filename);
    [...db.query(`CREATE TABLE IF NOT EXISTS [kv-storage] (area TEXT, key TEXT, value TEXT, PRIMARY KEY (area, key))`)];
  }

  async get(key: string): Promise<string | undefined> {
    return [...this.#db.query(`SELECT value FROM [kv-storage] WHERE key=? AND area=?`, [key, this.#area])][0]?.[0];
  }

  async set(key: string, value: string) {
    [...this.#db.query(
      `INSERT INTO [kv-storage] (area, key, value) VALUES (:area, :key, :value) 
       ON CONFLICT(area, key) DO UPDATE SET value=:value`,
      { key, value, area: this.#area },
    )];
  }

  async delete(key: string) {
    [...this.#db.query(`DELETE FROM [kv-storage] WHERE key=? AND area=?`, [key, this.#area])];
  }

  async clear() {
    [...this.#db.query(`DELETE FROM [kv-storage] WHERE area=?`, [this.#area])];
  }

  async *keys() {
    for (const [key] of this.#db.query(`SELECT key FROM [kv-storage] WHERE area=?`, [this.#area])) {
      yield key;
    }
  }

  async *values() {
    for (const [value] of this.#db.query(`SELECT value FROM [kv-storage] WHERE area=?`, [this.#area])) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of this.#db.query(`SELECT key, value FROM [kv-storage] WHERE area=?`, [this.#area])) {
      yield [key, value] as [string, string];
    }
  }

  backingStore() {
    return this.#db;
  }
}
