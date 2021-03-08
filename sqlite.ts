// Same as `mod.ts`, but with the SQLite adapter pre-imported.
import './adapters/sqlite.ts';
export { StorageArea, DenoStorageArea } from './mod.ts';
export type { DenoStorageAreaOptions, AllowedKey, Key, DBProtocol, DB_URL } from './mod.ts'
