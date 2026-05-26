# NinjaPipe Activepieces Piece

Activepieces piece for the NinjaPipe CRM.

## Piece contents

### Auth
- **Custom Auth** with `base_url` + `api_key` (Bearer token).
- Validation tests connection via `GET /contacts` and rejects loopback, private, and cloud-metadata hosts.

### Actions
- contact: create, update, get, list, delete, upsert, toggle client portal
- company: create, update, get, list, delete
- deal: create, update, get, list, delete
- product: create, update, get, list, delete
- budget: create, update, get, list, delete, create expense
- project: create, update, get, list, delete
- task: create, update, get, list, delete
- pipeline: create, update, get, list, delete
- order: create, update, get, list, delete
- Add to List (contact or company)
- Send to Databin
- Custom API Call (auto-generated via `createCustomApiCallAction`)

### Triggers (Polling)
- New Contact
- New Company
- New Deal
- New Task
- New or Updated Contact
- New or Updated Company
- New or Updated Deal
- New or Updated Task

## Wiring
- Add `"@activepieces/piece-ninjapipe": ["packages/pieces/community/ninjapipe/src/index.ts"]` alphabetically into the root `tsconfig.base.json` `compilerOptions.paths`.
- Build via `bun install` then `npx turbo run build --filter=@activepieces/piece-ninjapipe`.
