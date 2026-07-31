# Capture Recipes

The schema describes **what the action's `run()` returns**. The only reliable source of that is running the real step against a real connection. This file covers how.

## 0. Why run the piece (not the raw API)

Calling the third-party API directly with the connection's token is tempting, but the action often transforms the response (`response.body`, `response.data`, unwrapping, enrichment, mapping). If you capture the raw API JSON you'll map paths that don't exist on the returned object. Two safe approaches:

1. **Run the step (Test Step)** — faithful; the engine also refreshes OAuth tokens. **Preferred.**
2. **Call the API directly, then apply the transform** you read from `run()` — only when a step can't be run live, and always reconcile against the `run()` return statement.

OAuth caveat: some Google pieces construct a client that doesn't auto-refresh, so a direct call with an expired token 401s while Test Step (via the engine's connection manager) succeeds — another reason to prefer Test Step.

## 1. Set up the connection

Ask the user for credentials, then create the connection:

- **OAuth2 pieces** (Gmail, the Google pieces, most social/CRM apps): connect through the **builder UI sign-in** (Connections → New → authorize) — the browser MCP can drive it. Do **not** create these over the API: you won't have a valid access token. And do **not** capture against a cloud backend (`--mode=cloud`) — the OAuth redirect returns to `cloud.activepieces.com`, not your localhost; use a fully-local instance.
- **API-key / token / basic-auth pieces:** create via the UI or `POST /v1/app-connections` (body includes `externalId`, `pieceName`, `type`, `value`).

Note the connection's **external id** — step input references it as `{{connections['<externalId>']}}`.

## 2. Capture via the builder Test Step (primary)

The ground truth: what the builder itself shows.

1. In the builder, create a test flow (any trigger).
2. Add the piece action/trigger, select the connection, fill required props.
3. Click **Test Step**. The output panel shows the real output JSON — copy it.
4. For a **trigger**, use **Test Trigger** (polling triggers run `test()`; webhook triggers — see §5).

You can drive this headlessly with the browser MCP (`mcp__chrome-devtools__*` / `mcp__playwright__*`): navigate to the running frontend, sign in, build the flow, click Test Step, and read the output node. This is the most robust path for pieces whose inputs are awkward to construct by hand.

## 3. Capture via the test-step API (scriptable)

Committed endpoint, good for re-running and light batching. It **enqueues** a test run of the flow up to the named step.

```
POST /v1/authentication/sign-in     { email, password }  -> { token, projectId }
POST /v1/sample-data/test-step      { projectId, flowVersionId, stepName }
      -> a FlowRun record: { id, status, steps, ... }        // NOT { runId, output }
GET  /v1/sample-data?flowId=&flowVersionId=&stepName=&projectId=&type=OUTPUT
```

**The output is not in the synchronous response.** `test-step` returns a `FlowRun` (note `id`, not `runId`; a `status` enum, not a `success` boolean) that comes back with `status: QUEUED` and empty `steps: {}` — the real step output streams to the builder over websocket once the run completes. To capture it in a script, **poll** `GET /v1/sample-data?...&type=OUTPUT` (or re-fetch the run by `id` and read `steps[<stepName>].output`) until it's populated. Because of this asynchrony, the browser Test Step (§2) — which just shows the output when the run finishes — is usually the simpler path.

Dev sign-in for a fresh local instance is typically `dev@ap.com` / `12345678`. The backend is proxied at `http://localhost:4200/api` in dev (not the API port directly).

**Prerequisite:** a flow must already exist with the step configured (connection + props). The endpoint needs a `flowVersionId` + `stepName`; it does not create the step for you. Build the flow once in the UI (§2), then the API is handy for re-running after you tweak inputs or seed data. Constructing the flow purely over the API means driving the flow-update operations (`UPDATE_TRIGGER` / add-action) — heavier; only worth it when scripting many steps.

Write throwaway driver scripts under `/tmp` (e.g. `/tmp/<piece>_capture.mjs`) — do not commit them.

> Editing a **server** source file while a capture run is in flight hot-restarts the API and can wedge the worker (jobs stuck QUEUED). Only edit web/piece files mid-run, or restart the instance to recover.

## 4. Empty READ → WRITE first (required)

A read/list/search/get can return an empty body (`[]`, `{ results: [] }`, `404`) simply because the account has no data yet. **You must not author a list schema from an empty array.** Seed the data first:

1. Identify the corresponding **write** action (create row / create task / send message / upload file …).
2. Run it to create a record; capture the new id from its output.
3. Feed that id (or a matching filter) into the read/list/search input and re-run.
4. Now the read returns a populated payload → author the schema from it.

Chain ids across a dependency order where needed (create → get → update → list). Notion example: `create_database_item` yields a fresh page id reused by append/comment/retrieve; a find with an all-null filter returns empty, so filter by a value that matches the row you just created.

Leftover test records are usually fine (there's often no delete action for lists/channels); create them with obvious names (`OutputSchema Test …`) and clean up where a delete action exists.

## 5. Webhook triggers

A webhook trigger's schema describes **one delivered event payload** (the schema is for a single item; the trigger returns an array, one run per element).

- **Best:** capture a **real delivered event**. Local webhook URLs are `localhost` (unreachable by the third party), so expose the backend with `ngrok http 4200`, set `AP_FRONTEND_URL=<ngrok-url>`, and **restart api + worker** (the worker fetches the public URL at startup). Register the trigger (`POST /v1/test-trigger { testStrategy: 'SIMULATION' }`), fire the real event, and read the raw payload from ngrok's inspector (`GET localhost:4040/api/requests/http`, base64-decode `raw`, split on the blank line for the body). `GET /v1/trigger-events` often stays empty because simulation pushes over socket.io — use the ngrok inspector. Restore `localhost` (drop `AP_FRONTEND_URL`, restart) when done.
- **No ngrok needed** when the push is a content-free ping and `run()`/`test()` fetches the data itself (e.g. Google Calendar `new_event`): the trigger's `test()` output equals its per-run output — capture it via the test-step API on `localhost`.
- **Derive from `run()` enrichment**: if the raw webhook payload is thin but `run()` enriches it (e.g. fetches the full entity), the schema must describe the **enriched** result, not the raw hook body. Read `run()` and capture the enriched output.
- **Correct the sampleData**: a trigger's in-source `sampleData` is frequently wrong or incomplete. Trust the real captured payload over it, and fix `sampleData` if it's misleading.
- **Polymorphic payloads**: if one trigger can deliver structurally different events (message vs poll vs callback), do **not** give it a single schema — a "message" shape mislabels the others.

## 6. <a id="dev-piece-reload"></a>Reload a piece after building

Dev pieces load from each piece's built `dist/`, and the watcher only rebuilds on **source change after startup** — never on boot. A newly-added piece must be built once before it appears; a rebuilt piece needs a cache invalidation.

```bash
# build the piece (+ framework/common if needed)
npx turbo run build --filter=@activepieces/piece-<name> \
  --filter=@activepieces/pieces-framework --filter=@activepieces/pieces-common
# tsc doesn't copy src/i18n — copy it if the piece has one
cp -R packages/pieces/community/<name>/src/i18n packages/pieces/community/<name>/dist/src/i18n 2>/dev/null || true
# invalidate the in-memory dev-piece cache without a full restart:
touch packages/pieces/community/<name>/src/index.ts
```

`touch`ing one source file makes the running watcher rebuild it, then `invalidateDevPieceCache()` + `REFRESH_PIECE` reloads all dev pieces from dist and refreshes the frontend. Note: `outputSchema` is read from served piece **metadata**, so after a reload the builder picks it up; if the tree still looks raw, hard-refresh the frontend and confirm the piece version bumped.

If a freshly-added dev piece **still** doesn't appear after building + touching `index.ts`, check its `package.json` `minimumSupportedRelease` against the repo's current version — a piece that requires a newer release than the checkout is silently filtered out of the builder (no env override). Bump the repo's version, or the piece's `minimumSupportedRelease`, to load it.
