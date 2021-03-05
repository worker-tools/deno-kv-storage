import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts";

import { Md5Hash } from 'https://raw.githubusercontent.com/manyuanrong/deno-checksum/1.4.0/md5.ts';
import { Base64Encoder } from 'https://cdn.skypack.dev/base64-encoding?dts';

import { Store } from './store.ts';

export class SQLiteStore implements Store {
  #db: DB;
  #table: string;

  constructor({ table, filename }: { table: string, filename?: string }) {
    if (/[\[\]]/.test(table)) {
      // Deal with evil table names...
      table = new Base64Encoder({ url: true }).encode(new Md5Hash().digest(new TextEncoder().encode(table)));
    }
    this.#table = `kv-storage:${table}`;

    const db = this.#db = new DB(['', 'memory'].includes(filename ?? '') ? ':memory:' : filename);
    [...db.query(`CREATE TABLE IF NOT EXISTS [${this.#table}] (key TEXT PRIMARY KEY, value TEXT)`)];
  }

  async get(key: string): Promise<string | undefined> {
    return [...this.#db.query(`SELECT value FROM [${this.#table}] WHERE key=?`, [key])][0]?.[0];
  }

  async set(key: string, value: string) {
    [...this.#db.query(
      `INSERT INTO [${this.#table}] (key, value) VALUES (:key, :value) ON CONFLICT(key) DO UPDATE SET value=:value`,
      { key, value },
    )];
  }

  async delete(key: string) {
    [...this.#db.query(`DELETE FROM [${this.#table}] WHERE key=?`, [key])];
  }

  async clear() {
    [...this.#db.query(`DELETE FROM [${this.#table}]`)];
  }

  async *keys() {
    for (const [key] of this.#db.query(`SELECT key FROM [${this.#table}]`)) {
      yield key;
    }
  }

  async *values() {
    for (const [value] of this.#db.query(`SELECT value FROM [${this.#table}]`)) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of this.#db.query(`SELECT key, value FROM [${this.#table}]`)) {
      yield [key, value] as [string, string];
    }
  }

  backingStore() {
    return this.#db;
  }
}
