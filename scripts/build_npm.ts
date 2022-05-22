#!/usr/bin/env -S deno run --allow-read --allow-write=./,/Users/qwtel/Library/Caches/deno --allow-net --allow-env=HOME,DENO_AUTH_TOKENS,DENO_DIR --allow-run=git,pnpm

import { basename } from "https://deno.land/std@0.133.0/path/mod.ts";
import { build, emptyDir } from "https://deno.land/x/dnt@0.23.0/mod.ts";

import {
  copyMdFiles, mkPackage,
} from 'https://gist.githubusercontent.com/qwtel/ecf0c3ba7069a127b3d144afc06952f5/raw/latest-version.ts'

await emptyDir("./npm");

const name = basename(Deno.cwd())

await build({
  entryPoints: ["./mod.ts", {
    name: './sqlite',
    path: 'sqlite.ts'
  }, {
    name: './adapters/sqlite',
    path: 'adapters/sqlite.ts'
  }, {
    name: './postgres',
    path: 'postgres.ts'
  }, {
    name: './adapters/postgres',
    path: 'adapters/postgres.ts'
  }],
  outDir: "./npm",
  shims: {},
  test: false,
  typeCheck: false,
  declaration: false,
  package: await mkPackage(name),
  packageManager: 'pnpm',
  compilerOptions: {
    sourceMap: true,
    target: 'ES2019',
  },
  mappings: {
    "https://ghuc.cc/qwtel/kv-storage-interface/index.d.ts": {
      name: "kv-storage-interface",
      version: "latest",
    },
    "https://cdn.skypack.dev/idb-key-to-string?dts": {
      name: "idb-key-to-string",
      version: "latest",
    },
    "https://cdn.skypack.dev/typeson@7.0.2?dts": {
      name: "typeson",
      version: "^7.0.2",
    },
    "https://unpkg.com/typeson-registry@3.0.0/dist/index.js": {
      name: "typeson-registry",
      version: "^3.0.0",
    },
  },
});

// post build steps
await copyMdFiles()