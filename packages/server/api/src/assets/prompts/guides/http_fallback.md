# Guide: HTTP fallback when no connection exists

Load this when a piece connection is unavailable and the user cannot or declines to create one. Use the HTTP piece (`@activepieces/piece-http`, action `send_request`) to call the service's API directly. If the user declines the HTTP fallback too, report the limitation and stop.

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

4. For automation builds, use the HTTP piece step with the same contract and inline auth pattern.

If anything still fails after one corrected attempt, call `ap_get_piece_props('@activepieces/piece-http', 'send_request')` (passing your current `body_type`) to resolve the dynamic `body` sub-fields, fix once, and report if it still won't go through — do not re-send the same request repeatedly.

Always explain plainly: "Since we don't have a [App] connection set up, I'll call the [Service] API directly."
