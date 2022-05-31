// deno-lint-ignore-file no-explicit-any
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";

import type { Adapter, AdapterParams } from './mod.ts';

const CREATE = 'CREATE TABLE IF NOT EXISTS kv_storage (area TEXT, key TEXT, value TEXT, PRIMARY KEY (area, key))';
const GET = 'SELECT value FROM kv_storage WHERE key=$2 AND area=$1';
const UPSERT = 'INSERT INTO kv_storage (area, key, value) VALUES ($1, $2, $3) ON CONFLICT(area, key) DO UPDATE SET value=$3';
const DELETE = 'DELETE FROM kv_storage WHERE key=$2 AND area=$1';
const CLEAR = 'DELETE FROM kv_storage WHERE area=$1';
const KEYS = 'SELECT key FROM kv_storage WHERE area=$1';
const VALUES = 'SELECT value FROM kv_storage WHERE area=$1';
const ENTRIES = 'SELECT key, value FROM kv_storage WHERE area=$1';

export class PostgresAdapter implements Adapter {
  private area: string;
  private url: string;
  private init: Promise<void>;
  private client?: Client;

  constructor({ area, url }: AdapterParams) {
    this.area = area;
    this.url = url;

    this.init = (async () => {
      const client = this.client = new Client(url);
      await client.connect();
      // https://stackoverflow.com/questions/26150758/suppressing-notice-relation-exists-when-using-create-if-not-exists
      await client.queryArray(`SET client_min_messages = warning`);
      await client.queryArray(CREATE);
      this.keepOpen()
    })();
  }

  private keepOpen() {
    queueMicrotask(() => {
      if (this.client?.connected) this.client.end()
      delete this.client;
    })
  }

  private async query(query: string, { key, value }: { key?: string, value?: string } = {}) {
    await this.init;
    const client = this.client ||= new Client(this.url);
    if (!client.connected) await client.connect();
    const ret = (await client.queryArray<any>({
      text: query,
      args: [this.area, ...key ? [key] : [], ...value ? [value] : []],
    })).rows;
    this.keepOpen()
    return ret;
  }

  async get(key: string): Promise<string | undefined> {
    const res = (await this.query(GET, { key }))[0]?.[0];
    this.keepOpen()
    return res;
  }

  async set(key: string, value: string) {
    await this.query(UPSERT, { key, value });
    this.keepOpen()
  }

  async delete(key: string) {
    await this.query(DELETE, { key });
    this.keepOpen()
  }

  async clear() {
    await this.query(CLEAR);
    this.keepOpen()
  }

  async *keys() {
    try {
      for (const [key] of await this.query(KEYS)) {
        yield key;
      }
    } finally {
      this.keepOpen()
    }
  }

  async *values() {
    try {
      for (const [value] of await this.query(VALUES)) {
        yield value;
      }
    } finally {
      this.keepOpen()
    }
  }

  async *entries() {
    try {
      for (const [key, value] of await this.query(ENTRIES)) {
        yield [key, value] as [string, string];
      }
    } finally {
      this.keepOpen()
    }
  }

  backingStore() {
    return new Client(this.url);
  }
}

// @ts-ignore: ...
(globalThis.deno_storage_area__adapters ||= new Map()).set('postgres:', PostgresAdapter);
