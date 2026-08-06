# RingCentral piece (`@activepieces/piece-ringcentral`)

SMS, RingOut calls, call logs and Team Messaging.

## Connection setup

In the [RingCentral Developer Console](https://developers.ringcentral.com/), create a REST API app
using **OAuth 2.0 Authorization Code Flow** for a server/web app:

1. Add the redirect URI shown on the connection dialog to the app.
2. Enable the app scopes the flow needs: SMS, RingOut, Read Messages, Read Call Log, Read Accounts,
   TeamMessaging, Webhook Subscriptions.
3. Paste the app's Client ID and Client Secret into the connection, and pick the Environment
   (Production or Sandbox) the app is registered on. Sandbox apps only work against
   `platform.devtest.ringcentral.com`; graduation to production is a RingCentral-side step.

Every connection is an ordinary per-user OAuth login. Nothing here is shared platform-wide, which is
also why this piece keeps a Custom API Call action: it can only do what the connection's owner
already can.

## Actions

| Action | Endpoint | Notes |
|---|---|---|
| Send SMS | `POST /restapi/v1.0/account/~/extension/~/sms` | From must be an SMS-enabled RingCentral number |
| Make Call (RingOut) | `POST /restapi/v1.0/account/~/extension/~/ring-out` | Two-legged: calls "from" first, then connects "to" |
| Send Team Messaging Post | `POST /team-messaging/v1/chats/{chatId}/posts` | Markdown supported |
| Get Call Log | `GET /restapi/v1.0/account/~/extension/~/call-log` | Direction/type/date filters, paging via perPage |
| Get Extension Info | `GET /restapi/v1.0/account/~/extension/~` | The authenticated extension's profile |
| Custom API Call | any | Bearer token of this connection |

Reads retry on 5xx; writes never do, because a replayed RingOut dials someone twice and a replayed
SMS sends twice. Every request carries a 30s timeout.

## Triggers

All three are WebHook subscriptions (`/restapi/v1.0/subscription`) built by one factory
(`src/lib/common/subscription-trigger.ts`):

| Trigger | Event filter | Kept deliveries |
|---|---|---|
| New Inbound SMS | `message-store/instant?type=SMS` | `direction === 'Inbound'` |
| New Voicemail | `message-store/instant?type=VoiceMail` | all |
| New Team Messaging Post | `glip/posts` | `eventType === 'PostAdded'` |

Behaviour worth knowing:

- **Handshake:** RingCentral validates the endpoint by demanding its `Validation-Token` header
  echoed back; the trigger answers via `onHandshake` + `WebhookHandshakeStrategy.HEADER_PRESENT`.
- **Deliveries are not signed.** The only secret a genuine delivery carries is the subscription id
  minted at enable time, so `run()` compares `subscriptionId` against the stored one and drops
  everything else. A fabricated POST to the webhook URL therefore does nothing.
- **Dedupe:** message/post id (falling back to the delivery uuid) becomes the platform dedupe key.
  An event with no id at all passes through un-keyed rather than sharing a constant key, which
  would silently swallow every later one as a duplicate.
- **Lifetime:** subscriptions are created with the documented 20-year maximum, but RingCentral
  blacklists a subscription whose endpoint keeps failing deliveries, so disable/enable of the flow
  re-mints it and `onDisable` tolerates an already-dead id.

## Tests

| File | Covers |
|---|---|
| `src/index.test.ts` | piece surface: auth wiring, action/trigger names |
| `src/lib/common/client.test.ts` | server selection, timeout/retry policy, error translation |
| `src/lib/common/subscription-trigger.test.ts` | handshake, lifecycle, subscriptionId filtering, dedupe |
| `src/lib/actions/actions.test.ts` | prop-to-request mapping per action |

Run with `bun run test` from this directory.
