# Piece SDK — Building Integrations

This directory contains the piece framework, common utilities, core pieces, and 400+ community integration pieces.

## Quick Start

```bash
npm run create-piece     # Create new piece (interactive CLI)
npm run create-action    # Add action to existing piece
npm run create-trigger   # Add trigger to existing piece
```

After creating: add path to `tsconfig.base.json`: `"@activepieces/piece-{name}": ["packages/pieces/community/{name}/src/index.ts"]`

## Piece Structure

```
packages/pieces/community/{piece-name}/
├── src/
│   ├── index.ts                # createPiece() definition
│   └── lib/
│       ├── auth.ts             # Authentication definition
│       ├── common/             # Shared API client helpers
│       ├── actions/            # One file per action
│       │   └── create-record.ts
│       └── trigger/            # One file per trigger
│           └── new-record.ts
├── src/i18n/
│   └── translation.json        # English strings (identity-mapped)
├── package.json
├── tsconfig.json
└── tsconfig.lib.json
```

## Piece Definition

```typescript
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'

export const myPiece = createPiece({
    displayName: 'My App',
    description: 'Connect with My App',
    auth: myAuth,
    categories: [PieceCategory.PRODUCTIVITY],
    minimumSupportedRelease: '0.52.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/my-app.png',
    authors: ['your-github-username'],
    actions: [createRecord, updateRecord],
    triggers: [newRecord],
})
```

## Auth Patterns

```typescript
// API Key / Secret Text
export const myAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: 'https://api.myapp.com/me',
                authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
            })
            return { valid: true }
        } catch {
            return { valid: false, error: 'Invalid API key' }
        }
    },
})

// OAuth2
export const myAuth = PieceAuth.OAuth2({
    authUrl: 'https://myapp.com/oauth/authorize',
    tokenUrl: 'https://myapp.com/oauth/token',
    required: true,
    scope: ['read', 'write'],
})

// Custom Auth (multiple fields)
export const myAuth = PieceAuth.CustomAuth({
    required: true,
    props: {
        apiKey: PieceAuth.SecretText({ displayName: 'API Key', required: true }),
        domain: Property.ShortText({ displayName: 'Domain', required: true }),
    },
})
```

## Action Pattern

```typescript
import { createAction, Property } from '@activepieces/pieces-framework'
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common'

export const createRecord = createAction({
    auth: myAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Creates a new record',
    props: {
        name: Property.ShortText({ displayName: 'Name', required: true }),
        type: Property.Dropdown({
            displayName: 'Type',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const res = await httpClient.sendRequest({
                    method: HttpMethod.GET, url: 'https://api.myapp.com/types',
                    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
                })
                return { options: res.body.map((t: { name: string, id: string }) => ({ label: t.name, value: t.id })) }
            },
        }),
    },
    async run({ auth, propsValue }) {
        const res = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.myapp.com/records',
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            body: { name: propsValue.name, type: propsValue.type },
        })
        return res.body
    },
})
```

## Trigger Patterns

### Webhook Trigger
```typescript
export const newRecord = createTrigger({
    auth: myAuth,
    name: 'new_record',
    displayName: 'New Record',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: { id: '1', name: 'Sample' },
    async onEnable(ctx) {
        const webhook = await api.createWebhook(ctx.auth, ctx.webhookUrl)
        await ctx.store.put('_webhookId', webhook.id)
    },
    async onDisable(ctx) {
        const id = await ctx.store.get<string>('_webhookId')
        if (id) await api.deleteWebhook(ctx.auth, id)
    },
    async run(ctx) {
        return [ctx.payload.body]  // Must return array
    },
})
```

### Polling Trigger (with pollingHelper)
```typescript
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common'

const polling: Polling<string, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        const records = await api.getRecords(auth)
        return records.map((r) => ({
            epochMilliSeconds: Date.parse(r.createdAt),
            data: r,
        }))
    },
}

export const newRecord = createTrigger({
    auth: myAuth,
    name: 'new_record',
    displayName: 'New Record',
    type: TriggerStrategy.POLLING,
    props: {},
    sampleData: {},
    async test(ctx) { return pollingHelper.test(polling, ctx) },
    async onEnable(ctx) { await pollingHelper.onEnable(polling, ctx) },
    async onDisable(ctx) { await pollingHelper.onDisable(polling, ctx) },
    async run(ctx) { return pollingHelper.poll(polling, ctx) },
})
```

## Piece Execution Context

When a piece action/trigger runs, it receives a rich `context` object:

- `context.auth` — resolved credentials (OAuth token, API key, etc.)
- `context.propsValue` — resolved input properties
- `context.store` — key-value persistence across executions (`put`, `get`, `delete`)
- `context.files` — file upload/download service
- `context.connections` — manage OAuth connections
- `context.server` — API access (`token`, `apiUrl`, `publicUrl`)
- `context.project` — project metadata (`id`, `externalId`)
- `context.run.stop({ response })` — stop flow and return HTTP response to webhook caller
- `context.run.pause({ pauseMetadata })` — pause for delay or webhook callback
- `context.run.respond({ response })` — send HTTP response but continue flow execution
- `context.agent.tools()` — construct AI agent tool set
- `context.generateResumeUrl()` — creates webhook resume URL for paused flows
- `context.executionType` — `BEGIN` or `RESUME` (detect if resuming from pause)

## Property Types

| Method | Use For |
|--------|---------|
| `Property.ShortText()` | Single-line text |
| `Property.LongText()` | Multi-line text |
| `Property.Number()` | Numeric input |
| `Property.Checkbox()` | Boolean toggle |
| `Property.DateTime()` | Date/time picker |
| `Property.Dropdown()` | Dynamic dropdown (async options) |
| `Property.StaticDropdown()` | Static dropdown (fixed options) |
| `Property.MultiSelectDropdown()` | Dynamic multi-select |
| `Property.StaticMultiSelectDropdown()` | Static multi-select |
| `Property.Object()` | Key-value pairs |
| `Property.Array()` | List of items |
| `Property.Json()` | JSON editor |
| `Property.File()` | File upload |
| `Property.DynamicProperties()` | Dynamic form fields based on other prop values |

## HTTP Client

Always use `httpClient` from `@activepieces/pieces-common`:

```typescript
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common'

const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: 'https://api.example.com/resource',
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
    queryParams: { page: '1' },
})
// res.body contains parsed JSON
```

## Key Rules

- One action per file, one trigger per file
- `name` must be unique, snake_case
- `run()` receives context with `auth`, `propsValue`, `store`, `files`
- Trigger `run()` must return an **array** of items
- Use `context.store` for persisting state (webhook IDs, last poll timestamps)
- Always provide `sampleData` for triggers
- i18n: `src/i18n/translation.json` with identity-mapped English keys, auto-loaded at runtime
