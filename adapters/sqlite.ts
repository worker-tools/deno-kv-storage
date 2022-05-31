// deno-lint-ignore-file require-await
import { DB } from "https://deno.land/x/sqlite@v2.5.0/mod.ts";

import type { Adapter, AdapterParams } from './mod.ts';

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
  private db?: DB;
  private memory: boolean;
  private refs = 0

  constructor({ area, url }: AdapterParams) {
    this.area = area;

    const filename = url.substring('sqlite://'.length);
    const memory = this.memory = ['', 'memory'].includes(filename ?? '');
    const db = this.db = new DB(this.filename = memory ? ':memory:' : filename);
    [...db.query(CREATE)];
    this.keepOpen();
  }

  private keepOpen() {
    if (!this.memory) queueMicrotask(() => {
      if (this.refs === 0) {
        this.db?.close()
        delete this.db;
      }
    })
  }

  private query(query: string, params?: { key?: string, value?: string }) {
    const db = this.db ||= new DB(this.filename);
    const rows = db.query(query, { ...params, area: this.area });
    return rows;
  }

  async get(key: string): Promise<string | undefined> {
    const res = this.query(GET, { key }).next().value?.[0];
    this.keepOpen()
    return res;
  }

  async set(key: string, value: string) {
    [...this.query(UPSERT, { key, value })];
    this.keepOpen()
  }

  async delete(key: string) {
    [...this.query(DELETE, { key })];
    this.keepOpen()
  }

  async clear() {
    [...this.query(CLEAR)];
    this.keepOpen()
  }

  async *keys() {
    try {
      this.refs++
      for (const [key] of this.query(KEYS)) {
        yield key;
      }
    } finally {
      this.refs--;
      this.keepOpen()
    }
  }

  async *values() {
    try {
      this.refs++
      for (const [value] of this.query(VALUES)) {
        yield value;
      }
    } finally {
      this.refs--
      this.keepOpen()
    }
  }

  async *entries() {
    try {
      this.refs++
      for (const [key, value] of this.query(ENTRIES)) {
        yield [key, value] as const;
      }
    } finally {
      this.refs--;
      this.keepOpen()
    }
  }

  backingStore() {
    return this.db ?? new DB(this.filename);
  }
}

// @ts-ignore: ...
(globalThis.deno_storage_area__adapters ||= new Map()).set('sqlite:', SQLiteAdapter);
