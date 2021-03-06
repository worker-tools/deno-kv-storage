import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts";

import { Adapter, AdapterParams, adapters } from './mod.ts';

const CREATE = 'CREATE TABLE IF NOT EXISTS [kv-storage] (area TEXT, key TEXT, value TEXT, PRIMARY KEY (area, key))';
const GET = 'SELECT value FROM [kv-storage] WHERE key=:key AND area=:area';
const UPSERT = 'INSERT INTO [kv-storage] (area, key, value) VALUES (:area, :key, :value) ON CONFLICT(area, key) DO UPDATE SET value=:value';
const DELETE = 'DELETE FROM [kv-storage] WHERE key=:key AND area=:area';
const CLEAR = 'DELETE FROM [kv-storage] WHERE area=:area';
const KEYS = 'SELECT key FROM [kv-storage] WHERE area=:area';
const VALUES = 'SELECT value FROM [kv-storage] WHERE area=:area';
const ENTRIES = 'SELECT key, value FROM [kv-storage] WHERE area=:area';

export class SQLiteAdapter implements Adapter {
  private filename: string;
  private area: string;

  constructor({ area, url }: AdapterParams) {
    this.area = area;

    const filename = url.substr('sqlite://'.length);
    this.filename = ['', 'memory'].includes(filename ?? '') ? ':memory:' : filename;
    const db = new DB(this.filename);
    [...db.query(CREATE)];
    db.close()
  }

  private query(query: string, params?: { key?: string, value?: string }) {
    const db = new DB(this.filename);
    const ret =  [...db.query(query, { ...params, area: this.area })];
    db.close();
    return ret;
  }

  async get(key: string): Promise<string | undefined> {
    return this.query(GET, { key })[0]?.[0];
  }

  async set(key: string, value: string) {
    this.query(UPSERT, { key, value });
  }

  async delete(key: string) {
    this.query(DELETE, { key });
  }

  async clear() {
    this.query(CLEAR);
  }

  async *keys() {
    for (const [key] of this.query(KEYS)) {
      yield key;
    }
  }

  async *values() {
    for (const [value] of this.query(VALUES)) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of this.query(ENTRIES)) {
      yield [key, value] as [string, string];
    }
  }

  backingStore() {
    return new DB(this.filename);
  }
}

adapters.set('sqlite:', SQLiteAdapter);
