# WhatsApp by SyncMate

Send WhatsApp messages from Activepieces and start flows on WhatsApp events, through
[SyncMate](https://app.assistro.co) (Assistro). Works with a QR-connected WhatsApp number and with
the WhatsApp Business (Meta Cloud) API.

## Connect

1. Log in at [app.assistro.co](https://app.assistro.co) and pick the WhatsApp number to use.
2. Open **Apps → Activepieces** and copy the API key from **API Configuration**.
3. In Activepieces, add a **WhatsApp by SyncMate** connection and paste the key.

Each key belongs to one WhatsApp number; switch the number in SyncMate to get its key.

## Actions

| Action | What it does |
| --- | --- |
| Send Message to Contact / Group / Channel | Text, with optional files (file, URL or base64), from a QR-connected number |
| Send Bulk Message | One message to many numbers, with an optional gap between sends |
| Meta: Send Text / Template / Media | WhatsApp Business messages; template variables and a header image or document |
| Meta: List Templates | The number's approved templates |
| List Groups / List Channels | Groups and channels of a QR-connected number |
| Check Number Connection | Whether the number is connected |
| Get Send Status | Status of a queued message |
| Custom API Call | Any SyncMate API endpoint with the connection's key |

## Triggers

| Trigger | Starts when |
| --- | --- |
| New Message Received | A customer sends the number a message |
| New Outgoing Message | The number sends a message (from any app) |
| Message Status Updated | A sent message is delivered, read or fails |

Triggers are webhooks: SyncMate signs every delivery (`X-Assistro-Signature`, HMAC-SHA256) and the
piece drops any delivery whose signature does not match.

## Development

```bash
cd packages/pieces/community/syncmate
npm run build
npm run lint
npm test        # unit + end-to-end tests against a local stand-in for the SyncMate API
```
