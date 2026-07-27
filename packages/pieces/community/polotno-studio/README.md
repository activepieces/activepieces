# Polotno Studio

Render images and videos from [Polotno Studio](https://polotno.com/studio) templates.

## Connect

1. Open Polotno Studio and go to **API Keys**.
2. Create a key — it starts with `key_live_` or `key_test_`.
3. Paste it into the connection. Keys are scoped to one project.

## Actions

| Action | What it does |
|---|---|
| Render Image | Renders a PNG, JPEG or PDF from a template |
| Render Video | Renders an MP4 or GIF from a template |
| Get Image | Looks up an image render by id |
| Get Video | Looks up a video render by id |
| Find Templates | Lists templates, optionally filtered by name or tag |
| Get Template | Looks up one template by id |
| Custom API Call | Any other Polotno Studio API endpoint |

Selecting a template loads its editable fields as native inputs, so there is no
JSON to hand-write.

## Waiting for renders

**Wait for Completion** is on by default. The flow pauses and Polotno Studio
calls back the moment the render finishes, so no worker time is spent waiting —
this handles long videos comfortably.

That callback requires your Activepieces instance to be reachable at a **public
https address**. On a self-hosted instance published at `localhost`, a private IP
or plain http, the piece detects this and polls the render instead, giving up
after **Max Wait (seconds)** and returning the still-pending render with
`timed_out: true`. Every successful result carries `timed_out: false`, so a
timeout is always distinguishable from success.

Turn Wait for Completion off to continue immediately with a pending render, then
use a trigger or Get Image / Get Video to pick up the result later.

## Triggers

**Image Rendered**, **Video Rendered** and **Render Failed** subscribe to project
webhooks and fire for every matching render, including renders started outside
Activepieces. Each delivery is verified with an HMAC signature and rejected if it
does not match, so tampered or replayed deliveries never start a flow. Deliveries
are retried around seven times over 24 hours; deduplicate on the render `id` if
your flow is not idempotent.

Webhook triggers cannot be exercised with Test Flow. Publish the flow, render
something, and check the run in the dashboard.

## Credits and limits

- Image: 1 credit, or 3 for a PDF or output larger than 3000×3000 px.
- Video: 1 credit per second of output, rounded up.

Result URLs expire about **7 days** after the render completes (see `expires_at`).
Download or copy anything you need to keep.
