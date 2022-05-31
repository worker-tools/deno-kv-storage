/**
 * WIP MySQL Adapter
 * Work abandoned due to primary key size limitations, as well as predictable crash of the mysql library when
 * writing large (~16 MB) TEXT fields...
 */
import { Client, ClientConfig, configLogger } from "https://deno.land/x/mysql/mod.ts";

import { Adapter, AdapterParams } from './mod.ts';

// FIXME: 255 char limitation for key => Not good
const CREATE = 'CREATE TABLE IF NOT EXISTS kv_storage (area VARCHAR(255), rkey VARCHAR(511), value JSON, PRIMARY KEY (area, rkey))';
const GET = 'SELECT value FROM kv_storage WHERE area=? AND rkey=?';
const UPSERT = 'REPLACE INTO kv_storage (area, rkey, value) VALUES (?, ?, ?)';
const DELETE = 'DELETE FROM kv_storage WHERE area=? AND rkey=?';
const CLEAR = 'DELETE FROM kv_storage WHERE area=?';
const KEYS = 'SELECT rkey FROM kv_storage WHERE area=?';
const VALUES = 'SELECT value FROM kv_storage WHERE area=?';
const ENTRIES = 'SELECT rkey, value FROM kv_storage WHERE area=?';

await configLogger({ enable: false });

export class MySQLAdapter implements Adapter {
  private area: string;
  private opts: ClientConfig;
  private ready: Promise<void>;

  constructor({ area, url }: AdapterParams) {
    this.area = area;

    const { hostname, username, port, password, pathname } = new URL(url);

    const opts = this.opts = {
      charset: 'utf8mb4',
      hostname,
      username,
      password,
      ...port ? { port: Number(port) } : {},
      ...pathname ? { db: pathname.substr(1) } : {},
    }
    
    this.ready = (async () => {
      // TODO error??
      const client = await new Client().connect(opts);
      await client.execute(CREATE);
      await client.close();
    })();
  }

  private async query(query: string, { key, value }: { key?: string, value?: string } = {}) {
    await this.ready;
    const client = await new Client().connect(this.opts);
    const retVal = (await client.query(query, [this.area, ...key ? [key] : [], ...value ? [value] : [] ]))
    await client.close();
    return retVal.map((x: any) => Object.values(x));
  }

  private async execute(query: string, { key, value }: { key?: string, value?: string } = {}) {
    await this.ready;
    const client = await new Client().connect(this.opts);
    const retVal = (await client.query(query, [this.area, ...key ? [key] : [], ...value ? [value] : []]));
    await client.close();
    return retVal;
  }

  async get(key: string): Promise<string | undefined> {
    return (await this.query(GET, { key }))?.[0];
  }

  async set(key: string, value: string) {
    await this.execute(UPSERT, { key, value });
  }

  async delete(key: string) {
    await this.execute(DELETE, { key });
  }

  async clear() {
    await this.execute(CLEAR);
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
    return new Client().connect(this.opts);
  }
}

// @ts-ignore: ...
(globalThis.deno_storage_area__adapters ||= new Map()).set('mysql:', MySQLAdapter);
