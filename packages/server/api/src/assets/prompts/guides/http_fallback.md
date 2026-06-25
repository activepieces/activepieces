# Guide: calling an API directly over HTTP

Load this whenever the work needs a web API and either **no piece exists for that service at all**, or a piece exists but its connection is unavailable and the user can't/won't create one. Use the HTTP piece (`@activepieces/piece-http`, action `send_request`) to call the API directly and **carry the task to completion** — fetch the data, use it, finish the job. If the user declines the HTTP fallback too, report the limitation and stop.

**`ap_fetch_url` is NOT how you call an API.** `ap_fetch_url` reads a web *page* as text for your own reading; it is not the way to hit a JSON API and act on the result. To call an API (public or authed) and use its response in the task or an automation, ALWAYS use the HTTP piece `send_request` below — never stop at `ap_fetch_url` and hand back. A public API with no auth is the *easiest* case, not a reason to fall back to page-reading.

**First, prefer a native piece.** Before falling back to HTTP, confirm there isn't a native action that does this with no connection — e.g. Discord's `send_message_webhook` (just `webhook_url` + `content`), Slack incoming webhooks, etc. A native action has simple, validated fields and is far less error-prone than a raw HTTP request. Only use HTTP when no native action fits.

1. Identify the API endpoint from the app/action name (e.g. `gmail` → Gmail API, `slack` → Slack API).
2. Ask the user for their auth credentials (this is the one place a card is fine — a direct request for a specific value):
   - OAuth2 apps → ask for a Bearer Token (from the service's developer console).
   - API Key apps → ask for the API key.
   - Basic Auth apps → ask for username and password.
   - Public webhooks (Discord/Slack incoming webhooks, etc.) → no auth, use `authType: "NONE"`.
3. Build the request with `ap_execute_action` using the EXACT `send_request` contract below — do not invent field names.

## The `send_request` input contract (copy this shape exactly)

```jsonc
{
  "method": "POST",                       // GET | POST | PUT | PATCH | DELETE | HEAD
  "url": "https://api.example.com/things",
  "headers": { "Content-Type": "application/json" },  // REQUIRED — pass {} if none
  "queryParams": {},                                  // REQUIRED — pass {} if none
  "authType": "NONE",                     // NONE | BASIC | BEARER_TOKEN
  // authFields depends on authType — OMIT entirely when authType is "NONE":
  //   BASIC        → "authFields": { "username": "...", "password": "..." }
  //   BEARER_TOKEN → "authFields": { "token": "..." }
  "body_type": "json",                    // none | json | raw | form_data — MUST set when sending a body
  "body": { "data": { "content": "hello" } }          // see body shapes below
}
```

**`body` shape depends on `body_type` (this is the #1 thing models get wrong):**
- `body_type: "json"` → `"body": { "data": { ...your JSON object... } }` — the JSON object is nested under a `data` key.
- `body_type: "raw"` → `"body": { "data": "<raw string>" }`.
- `body_type: "form_data"` → `"body": { ...flat key/value pairs... }`.
- `body_type: "none"` → omit `body`.

`headers`, `queryParams`, and `authType` are all **required** — always include them (use `{}` / `"NONE"` when empty). Never use a key called `authentication`, `type`, or `json_raw`; they don't exist.

## Worked example — post a message to a Discord webhook

```jsonc
{
  "method": "POST",
  "url": "https://discord.com/api/webhooks/XXX/YYY",
  "headers": { "Content-Type": "application/json" },
  "queryParams": {},
  "authType": "NONE",
  "body_type": "json",
  "body": { "data": { "content": "🎉 Your message text here" } }
}
```

## Worked example — GET data from a public API (no auth)

```jsonc
{
  "method": "GET",
  "url": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
  "headers": {},
  "queryParams": {},
  "authType": "NONE",
  "body_type": "none"
}
```
Then read the response and use it to finish the task (state the value, write it where it belongs, etc.) — the GET is the start, not the end.

4. For automation builds, use the HTTP piece step with the same contract and inline auth pattern.

If anything still fails after one corrected attempt, call `ap_get_piece_props('@activepieces/piece-http', 'send_request')` (passing your current `body_type`) to resolve the dynamic `body` sub-fields, fix once, and report if it still won't go through — do not re-send the same request repeatedly.

Always explain plainly: "Since we don't have a [App] connection set up, I'll call the [Service] API directly."
