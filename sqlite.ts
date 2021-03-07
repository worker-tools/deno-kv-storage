// Same as `mod.ts`, but with the SQLite adapter pre-imported.
import './adapters/sqlite.ts';
import { StorageArea, DenoStorageArea, DenoStorageAreaOptions, AllowedKey, Key } from './mod.ts';
export { StorageArea, DenoStorageArea };
export type { DenoStorageAreaOptions, AllowedKey, Key };
