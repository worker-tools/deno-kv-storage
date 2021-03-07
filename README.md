# Deno Storage Area

An implementation of the StorageArea ([1],[2],[3]) interface for Deno with an extensible system for supporting various database backends.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as [`kv-storage-polyfill`](https://github.com/GoogleChromeLabs/kv-storage-polyfill).

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
KV Storage is still a good interface for asynchronous data access that feels native to JavaScript.

## Example

```ts
// file: "mod.ts"
import { StorageArea } from 'https://deno.land/x/kvstorage/sqlite.ts';

const storage = new StorageArea();

await storage.set(['a', 3, new Date(0)], { 
  foo: 'bar',
  fizz: new Set(['buzz']),
  xyz: new Uint8Array([255]),
});

console.log(await storage.get(['a', 3, new Date(0)]));
```

## Prerequisites

A URL to a database needs to be provided via environment variable alongside the following permissions (for SQLite adapters):

    DENO_STORAGE_AREA__DEFAULT_URL=sqlite://database.sqlite deno run --allow-read --allow-write --allow-env mod.ts

There are other ways of providing the database URL:

*  As a static variable:

   ```ts
   StorageArea.defaultURL = 'sqlite://database.sqlite';
   ```

*  As a global variable:

   ```ts
   self['DENO_STORAGE_AREA__DEFAULT_URL'] = 'sqlite://database.sqlite';
   ```

*  As a constructor argument:

   ```ts
   new StorageArea('default', { url: 'sqlite://database.sqlite' });
   ```


[1]: https://developers.google.com/web/updates/2019/03/kv-storage
[2]: https://css-tricks.com/kv-storage/
[3]: https://github.com/WICG/kv-storage

## Features

Beyond the cross-worker-env aspects of using StorageArea, it aso provides a number of quality of life improvements over using other key value implementations:

* Wrapping and Unwrapping of many built-in types, such as `Map` and `Set` (Structured Clone Algorithm)
* Support for non-string keys and complex keys

## Disclaimers

Note that efficiency is not a goal. Specifically, if you have sizable `ArrayBuffer`s,
it's better to use a database implementation with proper support for binary data.
