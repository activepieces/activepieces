# Famulor

Use a workspace API key from **Settings → API & MCP** at https://app.famulor.io. The workspace needs API Access. Restrict the key to the scopes your flow needs; permissions and plan limits are enforced by Famulor.

## Current API support

Version 1.0.0 uses `https://app.famulor.io/api/v1`. Every one of the **423 operations** in the current public OpenAPI specification has its own **native action**, with its own path, query and body fields in the flow builder. This includes calls, assistants, Audience contacts, campaign leads, campaigns, phone numbers, SMS, bookings, knowledge bases, tools, history, voices, automations, missions and the remaining public workspace features. Common resource IDs use searchable workspace dropdowns; typing refreshes the choices from the API. Exact UUID lookup avoids scanning older pages, documented server search filters are used when available, and other name searches scan up to 50,000 records with an explicit limit notice. UUIDs can also be mapped from previous steps.

**Run Workspace API Operation** remains an optional alternative for choosing any of the same 423 operations from a searchable resource selector. Selecting an operation generates path, query and body fields. Required nested objects, arrays and alternative body schemas use JSON editors. Optional JSON fields use text inputs so leaving them blank omits them; enter valid JSON to set a value. Optional booleans offer an unselected/true/false choice. Unset dropdowns and blank fields are omitted. Additional Body Fields accepts documented fields not entered separately, including explicit empty strings, null, empty arrays or objects for supported clearing operations; filled named fields take precedence. The server validates nested schemas, conditional requirements, scopes and entitlements.

**Custom API Call** supports additional documented requests on the same API origin. It rejects other hosts, API paths outside `/api/v1/`, credential header overrides and redirect following. Authenticated calls do not follow redirects; native actions do not automatically retry writes.

Audio previews return an Activepieces file. Avatar and greeting uploads use the API's JSON alternatives (public URL or supported base64 payload), rather than multipart uploads.

Calls, SMS, campaigns, purchases and other paid operations can consume credits. Testing a write action executes it against the connected workspace; use explicit test data and check costs first.

## Triggers

The **32 native polling triggers** are:

- Calls: New Call, Phone Call Completed, New Inbound Call, New Outbound Call, New Web Call, Call Failed and Call Not Answered.
- Assistants and Audience: New Assistant, New Contact, New Segment and New Suppression Entry.
- Campaigns: New Campaign, Campaign Started, Campaign Paused, Campaign Completed, New Campaign Lead and Campaign Lead Completed.
- Conversations: Conversation Completed, New Conversation Activity, New Email Activity and New WhatsApp Activity.
- Resources: New Phone Number, New Knowledge Base, New Tool, New Automation and New Mission.
- Scheduling: New Booking, Booking Cancelled, Booking Completed, New Booking Event Type, New Scheduled Callback and Callback Completed.

The interval is controlled by Activepieces. Triggers only read the connected workspace and do not replace existing assistant or channel webhooks. The API has no independent webhook subscription endpoint for these event types.

Snapshot triggers (campaign statuses and leads, conversation completion, bookings, event types, callbacks, tools, automations, missions and suppression entries) establish a baseline on enable and emit the first observed occurrence per resource ID. Existing records in the selected status are skipped. Re-adding a lead, reopening a conversation or repeating the same status does not emit another occurrence. Transitions happening entirely between polls can be missed. New Conversation Activity emits again when the record's last activity changes.

Snapshot triggers scan the full result set because these endpoints do not expose a reliable change or membership cursor; bookings are sorted by appointment time. Baseline state is read in 32 bounded shards instead of performing a store read for every existing record. Very large workspaces still incur pagination costs. Scans reaching the 50,000-record safety limit and API-capped results fail without advancing the checkpoint.

Timestamp triggers use creation/update timestamps and paginate across timestamp ties. Phone Call Completed polls by update time and acknowledges call IDs; old calls finishing later are included, while reanalysis of an already completed call does not emit again. Invalid timestamps and incomplete pagination fail without advancing state. Republishing preserves the checkpoint.

Editor Test Flow samples do not acknowledge production delivery state. Poll outputs carry a reserved `_famulor_delivery` marker; only matching generation/hash markers are acknowledged, and stale-generation queued runs are ignored. Delivery is acknowledged in Activepieces' `onStart` hook, after a payload has been submitted and a flow run has started. A failed submission leaves the event available for the next poll. Stable native dedupe keys suppress overlapping submissions within Activepieces' dedupe window. This is not an exactly-once guarantee: longer overlaps or retries outside that window can still repeat an event, and polling cannot recover a record removed from the API before delivery. Use idempotent downstream writes when duplicates would matter. Acknowledgement confirms delivery to a flow run, not success of its later actions.

The API key needs each polled resource's read scope; scopes and entitlements are checked by the server. Examples: `calls:read` for calls/history, `assistants:read`, `leads:read`, `campaigns:read`, `phone_numbers:read`, `knowledge:read`, `bookings:read`, and `segments:read`. Consult the API reference for scopes of other resources and each action.

## Upgrade from 0.2.x

Existing flows stay pinned to their current piece version. Before upgrading, reconnect with a current workspace API key, replace numeric IDs with resource UUIDs, reselect action inputs and remap outputs using the current `data`/`meta` response shape.

Some legacy operations have different equivalents in the current API. Campaign control is now Start Campaign / Stop Campaign. Legacy chat, WhatsApp-send and call-deletion actions must be rebuilt using the corresponding native actions for the current documented messaging/history operations. Inbound Call is an asynchronous polling event, not a synchronous variable webhook. Phone Call Completed and Conversation Completed are now polling triggers and do not modify assistant webhook settings.

## Development

```bash
node scripts/generate-catalog.mjs /path/to/famulor/openapi.json
node scripts/generate-catalog.mjs /path/to/famulor/openapi.json --check
npx turbo run build lint test --filter=@activepieces/piece-famulor
```

The generator records the source SHA-256 and operation count. It rejects unsafe/reserved operation IDs and generated name/filename collisions before writing any output. Commit the generated catalog, all native action files and the native registry when the public API changes. Each trigger has a separate definition file. The test suite runs every registered native action and trigger with a mocked HTTP boundary; they do not start real calls, send messages, purchase numbers or modify customer workspaces.

API reference: https://docs.famulor.io/api-reference/introduction

## Branding

The piece uses the current official Famulor mark: https://www.famulor.io/logo/png-icon/mark-512x512.png. Activepieces directory/CDN copies of the old mark should be refreshed to this asset as part of publication.
