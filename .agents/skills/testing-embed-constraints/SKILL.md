---
name: testing-embed-constraints
description: End-to-end test the embed publish constraints feature (required-piece publish gate + trigger lock modes none/locked/frozen) in the Activepieces builder. Use when verifying flow.metadata.embedConstraints UI behavior or the server-side guards. Generalizes to any builder feature that seeds pieces/flows directly into a fresh dev DB.
---

# Testing embed publish constraints (required piece + trigger lock)

Feature: per-flow `flow.metadata.embedConstraints = { requiredPieceNames?: string[]; triggerLock?: 'none'|'locked'|'frozen' }`.
Enforced in the builder UI and unbypassably server-side.

## Local stack
- Start docker DB + Redis, then `npm run dev` (turbo: web:4200, api:3000, engine, worker). Sign in `dev@ap.com` / `12345678`.
- `.env.dev` must point at Postgres + Redis (`AP_DB_TYPE=POSTGRES`, `AP_QUEUE_MODE=REDIS`, `AP_PIECES_SYNC_MODE=NONE`).

## Critical gotchas (these cost the most time)
1. **Trigger `type` must be `"PIECE_TRIGGER"`, not `"PIECE"`.** `FlowTriggerType.PIECE === 'PIECE_TRIGGER'` (see `packages/core/execution/src/lib/flows/triggers/trigger.ts`). If a hand-seeded `flow_version.trigger` uses `"PIECE"`, the settings form renders "Incomplete"/blank AND `isTriggerStep` is false so `frozen` readonly never activates. The context menu still works because it matches by trigger *name*, masking the problem. Always seed `"type": "PIECE_TRIGGER"` and include `settings.triggerName` (e.g. `"every_hour"`).
2. **Fresh dev DB has an empty `piece_metadata` table** (`AP_PIECES_SYNC_MODE=NONE`). Seed the pieces you need (e.g. `schedule`, `smarterproctoring`) as rows, then invalidate the API's in-memory registry cache so the single-piece GET returns them:
   `docker exec <redis> redis-cli PUBLISH piece-registry-invalidation 1`
3. **Set constraints via SQL** to simulate the vendor's API flow creation:
   `UPDATE flow SET metadata = '{"embedConstraints": {"triggerLock":"frozen"}}'::json WHERE id='<flowId>';` then reload (F5).

## What to verify (reliable UI signals, no product code needed)
Read the annotated DOM rather than guessing from pixels:
- **none**: right-click trigger → context menu contains **Replace**.
- **locked**: **Replace** gone from context menu; Sample Field `contenteditable="true"`; version switcher present.
- **frozen**: **Replace** gone; Sample Field `contenteditable="false"`; version switcher + step-name pencil (`aria-label="Edit Step Name"`) removed. NB `EditableStepName` only renders the pencil/aria-label when `readonly=false`, so their absence is a clean readonly signal.
- **required piece missing**: `<button name="Publish" disabled="true">` + hover tooltip "This flow must include the {DisplayName} step to publish".
- **required piece present** (add the piece name to `requiredPieceNames`, e.g. the trigger's own piece): Publish button loses `disabled`.

## Server guards (definitive, unbypassable) — run these
Framework is **vitest**, NOT jest (`npx jest` will hang trying to install). No root `.bin/jest`.
```
cd packages/server/api
export $(cat .env.tests | grep -v '^#' | xargs) && AP_EDITION=ce \
  node_modules/.bin/vitest run test/integration/ce/flows/flow/embed-constraints.test.ts
```
`.env.tests` uses the SAME `activepieces` DB and cleans tables between tests, so run integration tests AFTER finishing UI tests (it will wipe your seeded flow). Expect 8/8: required-piece reject/allow, UPDATE_METADATA wipe neutralized, subflow exemption, locked/frozen swap rejected via UPDATE_TRIGGER and IMPORT_FLOW (409), locked input-edit allowed (200).

## Recording
Record the UI walkthrough (none→locked→frozen, publish gate missing→present) with `annotate_recording` (setup + test_start + assertion per scenario). Convert to webp for PR embedding:
`ffmpeg -y -i edited.mp4 -vf "fps=8,scale=900:-1:flags=lanczos" -loop 0 -an out.webp`

## Devin Secrets Needed
None. Local dev creds (`dev@ap.com` / `12345678`) and local Postgres password live in `.env.dev`/`.env.tests`.
