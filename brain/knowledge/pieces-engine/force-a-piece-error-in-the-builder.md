---
title: Force a Piece Error in the Builder
icon: 🎭
---

# Force a Piece Error in the Builder

How to make a real piece fail on demand, so you can see the actual dialog a customer sees
instead of trusting a unit test. Point a piece at a mock instance you control, then choose the
HTTP shape it returns. Used to reproduce GIT-1857 (the `TRIGGER_UPDATE_STATUS` dialog).

## Pick the vehicle

A piece is usable here when all three hold. Check them in this order — the second one is what
disqualifies most candidates:

1. **Auth exposes a user-supplied base URL** (`Property.ShortText`, self-hosted style) so you can
   aim it at `127.0.0.1` with no code change.
2. **Auth has no `validate`** — otherwise the connection will not save until your mock answers the
   validation call too.
3. **The trigger has no API-backed props** — a dynamic dropdown cannot populate against a mock in a
   failure mode, so `props: {}` saves a lot of fiddling.

`chatwoot` satisfies all three: `Chatwoot URL` is plain text, there is no `validate`, `new_message`
has `props: {}`, and its `onEnable` GETs `{baseUrl}/api/v1/accounts/{accountId}/webhooks` and
rethrows anything that is not a 422 "already been taken".

**For an error whose `request.body` carries a credential, use `baserow` in `Email & Password (JWT)`
mode instead.** Its `onEnable` → `makeClient` POSTs `{email, password}`, so the password lands in
the serialized error. Chatwoot's failing call is a GET, so its envelope has an empty `request` —
you get the blob but no secret. Baserow *does* have a `validate` hitting the same endpoint, so save
the connection while the mock still answers 200, then switch it to the failure shape.

## Steps

1. Run a mock HTTP server on `127.0.0.1` that returns a chosen status and body, with a
   `/__mode/<shape>` route so you can switch shape without a restart. Cover at least: 401 with an
   empty body, 401 with no body, a body keyed `msg`, a body keyed `Message`, an array with no
   message, and one body that *does* carry `{message}` as the control.
2. `npx turbo run build --filter=@activepieces/piece-<name>` — **`AP_DEV_PIECES` loads from `dist`,
   not from source**, so an unbuilt piece silently does not appear.
3. Add `AP_DEV_PIECES=<name>` to `.env.dev`, then `npm run dev`.
4. Build the flow, create the connection against `http://127.0.0.1:<port>`, set the mock shape,
   then **Publish** or flip the enable toggle.
5. Watch the mock's request log to confirm the call landed. A dialog with no corresponding log line
   means the piece never reached your mock.

## Gotchas

- **This works only because `AP_NETWORK_MODE` defaults to `UNRESTRICTED`.** The engine's SSRF guard
  (`server/engine/src/lib/network/ssrf-guard.ts`) installs its DNS and socket monkeypatches *only*
  under `STRICT`, so loopback is reachable from a piece in a default dev stack. If you have set
  `STRICT`, the mock is unreachable and the failure you see is `SSRFBlockedError`, not the one you
  wanted — add `AP_SSRF_ALLOW_LIST=127.0.0.1`. The guard is in-process JS patching and explicitly
  not a boundary against hostile code.
- **`standardError` on the dialog is `engineHelperResponse.error`**, which the engine builds as
  `JSON.stringify(formatPieceError(error, { raw: inspect(error) }))`. So whatever you make the API
  return, what the dialog receives is already a serialized `FriendlyPieceError` — see the
  message-is-JSON trap in [[building-pieces]] before rendering any part of it.
- **A mock is stronger evidence than a real third-party rejection, not weaker.** The realistic
  failure shapes (an empty 401 body, a message under a key nobody enumerated) are exactly the ones
  a live API gives you only by accident. Driving them deliberately is how you find out that the
  friendly path has no answer for them.

## Key files

- `packages/server/api/src/app/trigger/trigger-source` — `throwTriggerUpdateFailed` raises `TRIGGER_UPDATE_STATUS`
- `packages/server/engine/src/lib/operations` — wraps every hook error in `formatPieceError`
- `packages/server/engine/src/lib/network` — the SSRF guard and its `STRICT`-only switch
- `packages/server/api/src/app/pieces` — `loadDevPiecesIfEnabled`, the `AP_DEV_PIECES` reader
