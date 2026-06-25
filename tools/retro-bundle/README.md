# Path-2 retro-bundling pipeline

Ships pre-cutover Activepieces piece versions as small, self-contained bundles by re-bundling each
**published tarball** with its **own pinned deps** (equivalence by construction — no framework skew).
Implements the runbook phases P0→P3.

> **Test without a live S3 bucket.** Every stage defaults to a **local filesystem store** that mirrors
> the engine's S3 key layout (`pieces/{name-dashed}-{version}.tgz`). You can run the entire
> build → gate → seed → serve → install flow locally with no AWS/R2 and no running engine.

## Layout

```
tools/retro-bundle/
  lib/
    store.cjs           storage abstraction — backend: 'local' (filesystem) | 's3' (aws CLI)
    asset-detector.cjs  NEW — flags deps that load .wasm/.proto/forked siblings (the asset-drop class)
    build.cjs           hardened builder: pack → install --legacy-peer-deps → 2-pass esbuild → pinned externals
    gate.cjs            worker-faithful gate: bun install --ignore-scripts (no symlink) + load + asset-flush
    ledger.cjs          resumable per-S3-key JSONL state
    config.cjs          env/flag → config; store defaults to local
  orchestrator.cjs      P0–P3 driver: filter → build → gate → seed (resumable, idempotent)
  seed.cjs              promote staged bundles between stores (local staging → real S3), per phase
  rollback.cjs          delete S3 objects → resolver falls back to npm tarball
  verify-served.cjs     prove the SERVED bytes install+load (from store, or via the real engine 307)
  e2e.cjs               full local end-to-end test (no S3, no engine)
  targets/
    target-list.cjs     scans npm → target-list.json (every major.minor → latest patch)
    emit-flat.cjs        → publish-targets.{json,csv}  (the flat build queue)
    emit-links-csv.cjs   → target-bundles-with-npm-links.csv
    publish-targets.json the 1,754-target queue the orchestrator consumes (committed deliverable)
```

**Prerequisites:** `esbuild` (resolved from the monorepo's hoisted `node_modules`) and a global `bun`.
Run `npm install` (or `bun install`) at the **repo root** once so `esbuild` resolves. Run all commands
from this directory (`tools/retro-bundle/`).

## Quick start — fully local, no S3

```bash
cd tools/retro-bundle

# 1. End-to-end self-test (build → gate → seed-local → serve → load), incl. the openai asset-drop fix
node e2e.cjs

# 2. Build + gate + stage a few pieces to the LOCAL store (the default "bucket" is ./.local-s3)
node orchestrator.cjs --pieces hackernews,google-sheets,duckdb,openai

# 3. Prove a staged bundle would install & run when served
node verify-served.cjs --only @activepieces/piece-openai@0.9.2

# (re)generate the target list from npm
node targets/target-list.cjs && node targets/emit-flat.cjs && node targets/emit-links-csv.cjs

# 4. Dry-run a release by promoting local → another local dir (no S3 needed)
node seed.cjs --from local --to local --localDir2 ./.local-s3-dest --all
```

## Going to real S3 (Cloud)

Point the store at the same bucket/endpoint the engine reads. Nothing else changes.

```bash
export S3_BUCKET=ap-pieces S3_ENDPOINT=https://… S3_REGION=auto   # match the engine's config

# Stage everything locally first (vetted, no S3), then promote in phases:
node orchestrator.cjs --pieces hackernews            # canary: build+gate+stage locally
node seed.cjs --to s3 --only @activepieces/piece-hackernews@0.4.4   # promote canary to S3
node verify-served.cjs --only @activepieces/piece-hackernews@0.4.4 \
     --engine https://cloud.activepieces.com --token "$ENGINE_TOKEN"   # real 307 round-trip

# Batch the rest, then promote
node orchestrator.cjs                                # all 1,745 eligible targets
node seed.cjs --to s3 --all

# Rollback one target (engine falls back to its npm tarball)
node rollback.cjs --only @activepieces/piece-openai@0.9.2
```

## How each guarantee is enforced

| Concern | Where it's handled |
|---|---|
| No framework skew | builder installs the version's **own** pinned deps; gate FAILs on any `@activepieces/*` leak |
| Peer-dep conflicts (e.g. openai/zod) | `npm install --legacy-peer-deps` |
| Asset-drop deps (tiktoken `.wasm`, etc.) | `asset-detector` externalizes+pins them so the runtime install ships the asset; gate's asset-flush is the backstop |
| Forked sibling scripts (oracle) | gate's assembled-bundle scan → `QUARANTINE` |
| Floating `*` externals | builder pins every external to its exact installed version; build FAILs if it can't |
| Oversized inline (>5 MB) | external-by-default fallback |
| Resumable / idempotent | per-S3-key ledger + `store.head()` pre-check |
| Rollback | `rollback.cjs` deletes the object; original npm version is never mutated |
| Scope | S3/Cloud only — CE with S3 disabled always serves the npm tarball (unchanged) |

A missing/failed/quarantined target is a **perf regression only, never a broken piece** — the engine's
existing npm-tarball fallback serves it.

## Config (env)

| Var | Default | Meaning |
|---|---|---|
| `RETRO_STORE` | `local` (or `s3` if `S3_BUCKET` set) | store backend |
| `RETRO_LOCAL_DIR` | `pipeline/.local-s3` | local "bucket" dir |
| `S3_BUCKET` / `S3_ENDPOINT` / `S3_REGION` | — | real S3 (must match the engine's config) |
| `RETRO_CSV` | `../publish-targets.json` | target list |
| `RETRO_LEDGER` | `pipeline/retro-state.jsonl` | resumable state |
