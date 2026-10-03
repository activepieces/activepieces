# Famulor

Use a workspace API key from **Settings → API & MCP** at https://app.famulor.io. The workspace needs API Access. Restrict the key to the scopes your flow needs; permissions and plan limits are enforced by Famulor.

## Current API support

Version 1.0.0 uses `https://app.famulor.io/api/v1`. It includes dedicated actions for calls, assistants, Audience contacts, campaign leads, campaigns, phone numbers, SMS, bookings, knowledge bases, tools, history and voices.

**Run Workspace API Operation** exposes all 423 operations from the public OpenAPI specification, grouped by resource in its searchable operation selector. Selecting an operation generates path, query and body fields. Nested objects, arrays and alternative body schemas use JSON fields. Additional Body Fields accepts documented fields not entered separately. The server validates nested schemas, conditional requirements, scopes and entitlements.

**Custom API Call** supports additional documented requests on the same API origin. It rejects other hosts, API paths outside `/api/v1/`, credential header overrides and redirect following. Authenticated calls do not follow redirects; native actions do not automatically retry writes.

Audio previews return an Activepieces file. Avatar and greeting uploads use the API's JSON alternatives (public URL or supported base64 payload), rather than multipart uploads.

Calls, SMS, campaigns, purchases and other paid operations can consume credits. Testing a write action executes it against the connected workspace; use explicit test data and check costs first.

## Triggers

Polling triggers cover New Call, Phone Call Completed, New Inbound Call, New Assistant, New Contact, New Campaign, New Campaign Lead, Conversation Completed and New Conversation Activity. They do not replace existing assistant or channel webhooks. The interval is controlled by Activepieces.

New Campaign Lead detects first-time additions, including existing contacts assigned to a campaign. Conversation Completed detects the first completed occurrence of each messaging/email conversation. Both establish a baseline on enable and scan their paginated result set, with a 50,000-record safety limit. Re-adding the same lead or reopening the same completed conversation does not emit a second completion/addition event. New Conversation Activity emits again when the record's last activity changes.

Other triggers use creation/update timestamps, pagination and IDs at timestamp boundaries. Phone Call Completed polls by update time and deduplicates call IDs; old calls finishing later are included. Reanalysis of an already completed call does not emit again. Invalid timestamps, capped results and incomplete pagination fail without advancing the checkpoint. Republishing preserves the checkpoint.

Read scopes: `calls:read` for calls/history, `assistants:read` for assistants, `leads:read` for Audience contacts, and `campaigns:read` for campaigns/leads. Consult the operation description for action-specific scopes.

## Upgrade from 0.2.x

Existing flows stay pinned to their current piece version. Before upgrading, reconnect with a current workspace API key, replace numeric IDs with resource UUIDs, reselect action inputs and remap outputs using the current `data`/`meta` response shape.

Some legacy operations have different equivalents in the current API. Campaign control is now Start Campaign / Stop Campaign. Legacy chat, WhatsApp-send and call-deletion actions are replaced by the corresponding documented messaging/history operations in Run Workspace API Operation. Inbound Call is an asynchronous polling event, not a synchronous variable webhook. Phone Call Completed and Conversation Completed are now polling triggers and do not modify assistant webhook settings.

## Development

```bash
node scripts/generate-catalog.mjs /path/to/famulor/openapi.json
node scripts/generate-catalog.mjs /path/to/famulor/openapi.json --check
npx turbo run build lint test --filter=@activepieces/piece-famulor
```

The generator records the source SHA-256 and operation count. Commit the generated catalog when the public API changes. Tests mock the HTTP boundary; they do not start real calls, send messages, purchase numbers or modify customer workspaces.

API reference: https://docs.famulor.io/api-reference/introduction
