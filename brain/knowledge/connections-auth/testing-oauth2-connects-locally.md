---
icon: 🧪
---

# Testing OAuth2 Connects Locally

How to drive a real OAuth2 connect against a dev instance, including with a code shape no real provider will hand you. Useful for anything touching `getCode`, the redirect pages, or the token exchange — see the redirect-decoding gotcha on *App Connections*.

## Pick a piece with no managed app

Managed cloud apps are fetched from `secrets.activepieces.com/apps` in **every** edition, local dev included, so Google/Slack/Notion resolve to `CLOUD_OAUTH2` and you never touch the `OAUTH2` path. Only a piece absent from that list gives you custom OAuth2: today that is `canva`, `connectuc`, `harvest`, `http-oauth2`, `lead-connector`, `surveymonkey`, `zoho-invoice`, `zoom`.

Use **HTTP (OAuth2)** (`http-oauth2`) — it exposes `authUrl`, `tokenUrl` and `scopes` as props, so you can point it at a stub. **The tell that you are on the custom path: the dialog shows a Redirect URL field.** That field renders only for `AppConnectionType.OAUTH2` with `authorization_code`, so if it is missing you are on a managed app and testing the wrong branch.

## Stub provider

A ~40-line node server is enough: `GET /authorize` 302s to `redirect_uri?code=<encodeURIComponent(code)>&state=...`, `POST /token` reads `code` out of the form body and compares it to what it issued. Printing issued-vs-received makes corruption self-evident and doubles as the regression check.

## Gotchas

- **A code must contain a literal `%` to expose double-decoding.** `/` and `+` survive it, because `decodeURIComponent` on an already-decoded string with no `%` is a no-op — which is exactly why "most providers work" and why this class of bug reaches customers before anyone reproduces it. Use `k1%2Fk2` for corruption and `abc%zzdef` (invalid escape) for the `URIError` popup hang.
- **`safeHttp` rejects loopback**, so a stub `tokenUrl` is blocked at the server-side token exchange unless the address is in `AP_SSRF_ALLOW_LIST`. Use `127.0.0.1` or `127.0.0.0/8`, never `localhost`: a non-IP entry is parsed as a CIDR, throws, and is skipped with a `console.warn`, so it silently does nothing. Browser-side symptoms need no allow list; only the token step does.
- **Dev env vars reach the API through `dotenv` reading `.env.dev` in `bootstrap.ts`, not the OS environment.** `/proc/<pid>/environ` therefore contains no `AP_*` at all, and checking it tells you nothing about what the server actually read. `tsx watch` does not watch `.env.dev` either, so an env change needs a manual API restart, not a file save.
- You can arm the listener and skip the provider entirely: click Connect, then `window.postMessage({ code: '...' }, '*')` from the builder console. `getCode` accepts it because `redirectUrl.startsWith(event.origin)` holds same-origin. Post the value the redirect page *would* have posted, not the raw query value.
- Per the repo rules, do not run this against `--mode=cloud`: the provider redirects back to `cloud.activepieces.com`, not your dev frontend.

## Key files

- `packages/pieces/community/http-oauth2` — the piece with user-supplied `authUrl`/`tokenUrl`
- `packages/web/src/features/connections/utils/oauth2-utils.ts` — `openOAuth2Popup`, `getCode`
- `packages/web/src/app/connections/oauth2-connection-settings.tsx` — picks the redirect URL per connection type
- `packages/web/src/app/routes/redirect.tsx` and the `/redirect` route in `packages/server/api/src/app/app.ts` — the two in-repo redirect pages
