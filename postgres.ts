// Same as `mod.ts`, but with the Postgres adapter pre-imported.
import './adapters/postgres.ts';
export { StorageArea, DenoStorageArea } from './mod.ts';
export type { DenoStorageAreaOptions, AllowedKey, Key, DBProtocol, DB_URL } from './mod.ts'
