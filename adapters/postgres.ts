import { Client } from "https://deno.land/x/postgres/mod.ts";

import { Adapter, AdapterParams, adapters } from './mod.ts';

const CREATE = 'CREATE TABLE IF NOT EXISTS kv_storage (area TEXT, key TEXT, value TEXT, PRIMARY KEY (area, key))';
const GET = 'SELECT value FROM kv_storage WHERE key=$2 AND area=$1';
const UPSERT = 'INSERT INTO kv_storage (area, key, value) VALUES ($1, $2, $3) ON CONFLICT(area, key) DO UPDATE SET value=$3';
const DELETE = 'DELETE FROM kv_storage WHERE key=$2 AND area=$1';
const CLEAR = 'DELETE FROM kv_storage WHERE area=$1';
const KEYS = 'SELECT key FROM kv_storage WHERE area=$1';
const VALUES = 'SELECT value FROM kv_storage WHERE area=$1';
const ENTRIES = 'SELECT key, value FROM kv_storage WHERE area=$1';

export class PostgresAdapter implements Adapter {
  private client: Client;
  private area: string;
  private ready: Promise<void>;

  constructor({ area, url }: AdapterParams) {
    this.area = area;

    const client = this.client = new Client(url);

    this.ready = (async () => {
      // TODO error??
      await client.connect();
      // https://stackoverflow.com/questions/26150758/suppressing-notice-relation-exists-when-using-create-if-not-exists
      await client.queryArray(`SET client_min_messages = warning`);
      await client.queryArray(CREATE);
    })();
  }

  private async query(query: string, { key, value }: { key?: string, value?: string } = {}) {
    await this.ready;
    return (await this.client.queryArray<any>({ 
      text: query, 
      args: [this.area, ...key ? [key] : [], ...value ? [value]: []], 
    })).rows;
  }

  async get(key: string): Promise<string | undefined> {
    return (await this.query(GET, { key }))[0]?.[0];
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
    for (const [key] of await this.query(KEYS)) {
      yield key;
    }
  }

  async *values() {
    for (const [value] of await this.query(VALUES)) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of await this.query(ENTRIES)) {
      yield [key, value] as [string, string];
    }
  }

  backingStore() {
    return this.client;
  }
}

adapters.set('postgres:', PostgresAdapter);
