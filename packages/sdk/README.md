# @activepieces/sdk

Headless developer SDK for Activepieces. Run piece actions, manage connections, and discover
pieces/schemas from code — no UI, no flows.

> Requires an Activepieces **EE / Cloud** instance with the `headlessSdkEnabled` plan flag turned
> on. Authenticate with a platform API key (`sk-...`).

```ts
import { createClient } from '@activepieces/sdk'

const client = createClient({
  apiKey: 'sk-...',
  instanceUrl: 'https://cloud.activepieces.com',
})

// Create-or-get a project by your own external id; everything is scoped to it.
const session = await client.project('my-tenant-id')

// Discover pieces + resolve action input schema (dynamic dropdowns resolve when `auth` is passed).
const pieces = await session.pieces.list({ searchQuery: 'gmail' })
const props = await session.pieces.getProps({
  pieceName: 'slack',
  actionName: 'send_channel_message',
  auth: 'my_slack',
})

// Run a piece action directly.
const result = await session.actions.run({
  pieceName: 'gmail',
  actionName: 'send_email',
  connectionExternalId: 'gmail_personal',
  props: { to: 'user@example.com', subject: 'Hello', body: 'World' },
})

// Connections — credentials inline, or a hosted ConnectLink for OAuth.
await session.connections.createWithCredentials('http', {
  externalId: 'my_api',
  type: 'CUSTOM_AUTH',
  value: { type: 'CUSTOM_AUTH', props: { token: 'secret' } },
})

const link = await session.connections.createLink('gmail', { externalId: 'gmail_personal' })
console.log(link.redirectUrl) // send the user here
const connection = await link.waitForConnection({ timeoutMs: 60_000 })
```
