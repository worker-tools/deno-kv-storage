# Deno Storage Area

An implementation of the StorageArea ([1],[2],[3]) interface for Deno with an extensible system for supporting various database backends.

The goal of this class is ease of use and compatibility with other Storage Area implementations, 
such as [`kv-storage-polyfill`](https://github.com/GoogleChromeLabs/kv-storage-polyfill).

While work on [the specification](https://wicg.github.io/kv-storage/) itself has stopped, 
KV Storage is still a good interface for asynchronous data access that feels native to JavaScript.

## Example

```ts
// file: "mod.ts"
import { StorageArea } from 'https://deno.land/x/kv_storage/sqlite.ts';

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

--------

<p align="center"><a href="https://workers.tools"><img src="https://workers.tools/assets/img/logo.svg" width="100" height="100" /></a>
<p align="center">This module is part of the Worker Tools collection<br/>⁕

[Worker Tools](https://workers.tools) are a collection of TypeScript libraries for writing web servers in [Worker Runtimes](https://workers.js.org) such as Cloudflare Workers, Deno Deploy and Service Workers in the browser. 

If you liked this module, you might also like:

- 🧭 [__Worker Router__][router] --- Complete routing solution that works across CF Workers, Deno and Service Workers
- 🔋 [__Worker Middleware__][middleware] --- A suite of standalone HTTP server-side middleware with TypeScript support
- 📄 [__Worker HTML__][html] --- HTML templating and streaming response library
- 📦 [__Storage Area__][kv-storage] --- Key-value store abstraction across [Cloudflare KV][cloudflare-kv-storage], [Deno][deno-kv-storage] and browsers.
- 🆗 [__Response Creators__][response-creators] --- Factory functions for responses with pre-filled status and status text
- 🎏 [__Stream Response__][stream-response] --- Use async generators to build streaming responses for SSE, etc...
- 🥏 [__JSON Fetch__][json-fetch] --- Drop-in replacements for Fetch API classes with first class support for JSON.
- 🦑 [__JSON Stream__][json-stream] --- Streaming JSON parser/stingifier with first class support for web streams.

Worker Tools also includes a number of polyfills that help bridge the gap between Worker Runtimes:
- ✏️ [__HTML Rewriter__][html-rewriter] --- Cloudflare's HTML Rewriter for use in Deno, browsers, etc...
- 📍 [__Location Polyfill__][location-polyfill] --- A `Location` polyfill for Cloudflare Workers.
- 🦕 [__Deno Fetch Event Adapter__][deno-fetch-event-adapter] --- Dispatches global `fetch` events using Deno’s native HTTP server.

[router]: https://workers.tools/router
[middleware]: https://workers.tools/middleware
[html]: https://workers.tools/html
[kv-storage]: https://workers.tools/kv-storage
[cloudflare-kv-storage]: https://workers.tools/cloudflare-kv-storage
[deno-kv-storage]: https://workers.tools/deno-kv-storage
[kv-storage-polyfill]: https://workers.tools/kv-storage-polyfill
[response-creators]: https://workers.tools/response-creators
[stream-response]: https://workers.tools/stream-response
[json-fetch]: https://workers.tools/json-fetch
[json-stream]: https://workers.tools/json-stream
[request-cookie-store]: https://workers.tools/request-cookie-store
[extendable-promise]: https://workers.tools/extendable-promise
[html-rewriter]: https://workers.tools/html-rewriter
[location-polyfill]: https://workers.tools/location-polyfill
[deno-fetch-event-adapter]: https://workers.tools/deno-fetch-event-adapter

Fore more visit [workers.tools](https://workers.tools).
