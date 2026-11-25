---
id: piece-builds-fail-when-piece-code-uses-dirname-without
title: "Piece builds fail when piece code uses `__dirname` without declaring `bundleForkedEntries`"
added: '2026-08-21'
release: 0.89.0
---

The piece bundler now emits files a piece loads by path at runtime (for example a `child_process.fork` target) beside the main bundle, when they are declared in a `bundleForkedEntries` array in the piece's `package.json`, and it keeps dependencies that only those files import in the published manifest. Because an undeclared `__dirname`-relative file access always breaks after publishing — this is exactly how `@activepieces/piece-oracle-database` 0.1.11/0.1.12 shipped with every new connection failing — the build now fails loudly when a piece's source references `__dirname` and declares no forked entries. Previously such a piece built successfully and shipped broken.

#### What you need to do

Nothing for catalog pieces — oracle-database is the only piece that forks a sibling file, and this change fixes it (0.1.13). If you build custom pieces and one references `__dirname`, either declare the runtime-loaded file in `bundleForkedEntries` (see [Bundling Pieces](/build-pieces/misc/bundling-pieces)) or remove the `__dirname` usage. Already-published pieces keep working; the check runs at build time only.
