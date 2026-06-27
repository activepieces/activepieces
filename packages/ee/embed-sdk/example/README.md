# Embed Showcase — "Helio"

A fictional SaaS ("Helio") that embeds Activepieces as its automation product. It
exercises **every surface the `ee-embed-sdk` exposes** in one page, against your
**local** instance and the **locally built** SDK bundle — so you can see, by
looking, whether a change in this repo broke or shifted the embed experience.

This is a developer reference, not a product. Its job: be a fast, repeatable
"does the embed still work?" check. **If you're an agent making changes that
could touch the embed experience (the SDK, the `/embed` routes, the embed
provider, builder/dashboard chrome, theming, i18n, MCP, connections), run this
page and walk the checklist at the bottom before declaring done.**

---

## What it covers

| SDK surface | Where in the console | What you should see |
|---|---|---|
| `configure({ embedding })` | boots on load | Activepieces dashboard fills the main stage, authenticated |
| `styling.mode` light/dark | §2 Appearance | embed repaints in the chosen theme |
| `styling.fontFamily` / `fontUrl` | §2 Appearance | embed uses the custom font |
| `locale` | §3 Localization | embed UI translates |
| `dashboard.hideSidebar` / `hideFlowsPageNavbar` / `hidePageHeader` | §4 Dashboard | those chrome elements disappear |
| `builder.disableNavigation` / `hideFlowName` / `homeButtonIcon` | §5 Builder | open a flow to verify |
| `builder.homeButtonClickedHandler` | §5 Builder | host intercepts the home button (alert + log) |
| `hideExportAndImportFlow` / `hideDuplicateFlow` / `hideFolders` / `hideTables` | §6 | those affordances disappear |
| `navigate({ route })` + `navigation.handler` | §7 Navigate | iframe routes change; host URL hash + log update |
| `connect({ pieceName })` (overlay **and** popup) | §8 Connections | connection dialog opens; result logged |
| `mcpSettings()` | §9 MCP | MCP settings overlay opens |
| `generateMcpToken()` | §9 MCP | `{ mcpServerUrl, mcpToken }` printed |
| `authorizeMcp({ authRequestId })` | §9 MCP | OAuth consent overlay (needs a real `authRequestId`) |
| `request({ path, method })` | §10 Server requests | raw API response printed |
| role provisioning (ADMIN/EDITOR/VIEWER JWT) | §1 Session | permissions in the embed change |
| client postMessage protocol | Event log | `CLIENT_*` events stream live |

Init-time options (everything in `VENDOR_INIT`) are persisted to `sessionStorage`
and applied by **reloading** when you press **Apply configuration** — so the page
always boots from a single clean `configure()`, exactly like a real integration.
Live methods (navigate/connect/mcp/request) run without a reload.

---

## Prerequisites

- A **running local Activepieces instance with EE enabled** (embedding + signing
  keys are enterprise features). For this repo's dev setup that's the EE-on-Postgres
  launch — web on `http://localhost:4210`, API proxied through it.
- Node 18+ (uses built-in `fetch` and `crypto`; **zero npm dependencies**).

## One-time setup

The host backend needs a platform **signing key** to mint embedding JWTs.

**Automatic** (creates the key via the platform API and writes `.embed-config.json`):

```bash
cd packages/ee/embed-sdk/example
node setup.mjs --instance http://localhost:4210 --email <platform-admin-email> --password <password>
```

The email/password is the platform admin (the first user on a self-hosted instance).

**Manual** (if you'd rather not script it): create a key in **Platform Settings →
Signing Keys → Generate**, download the private key, then copy
`.embed-config.example.json` to `.embed-config.json` and fill in `signingKeyId` +
`privateKey`.

> `.embed-config.json` holds the private key and is git-ignored. Never commit it.

## Run

```bash
node server.mjs          # http://localhost:4400  (PORT env overrides)
```

On first run the server builds the SDK bundle (`npm run bundle` in
`packages/ee/embed-sdk`) if `dist/packages/ee/embed-sdk/bundled.js` is missing,
and serves it at `/sdk.js`. **Re-run `npm run bundle` and refresh after editing
the SDK** to test SDK changes. Editing the `/embed` routes or web app is picked up
by the AP dev server automatically — just refresh.

---

## Robustness checklist (walk this after embed-related changes)

1. **Boot** — page loads, stage shows the AP dashboard, status dot turns green,
   log shows `CLIENT_INIT → … → CLIENT_CONFIGURATION_FINISHED`. No console errors.
2. **Theme** — switch §2 to Dark, Apply. Embed repaints dark. Switch back.
3. **Locale** — set §3 to `de`, Apply. Embed UI is German.
4. **Dashboard chrome** — toggle each §4 flag, Apply. Each hides exactly its target
   and nothing else.
5. **Navigate** — click Flows / Runs / Connections / Tables / Todos (§7). Iframe
   routes; the log shows a `route →` line and the URL hash updates each time.
6. **Builder** — navigate into a flow. Toggle §5 flags + §6 flags, Apply, reopen:
   flow name, home-button icon, export/import, duplicate, folders all respond.
7. **Home handler** — enable §5 "Intercept home button", Apply, open a flow, click
   home: Helio shows its own alert instead of AP navigating.
8. **Connections** — §8 "Connect (overlay)" opens the dialog in an iframe overlay;
   "Connect (popup)" opens it in a popup window. Closing logs the result.
9. **MCP** — §9 "Open MCP settings" overlays the MCP dialog; "Generate MCP token"
   prints credentials.
10. **Server request** — §10 "GET users/me" prints the embedded user; confirms the
    JWT exchange + `request()` path works.
11. **Roles** — set §1 to VIEWER, Apply. Editing affordances in the embed are gone.
12. **Event log** — throughout, the log should never show an `error` line or a
    silent gap where a `CLIENT_*` event was expected.

If any step regresses, the change under review affected the embed contract.
