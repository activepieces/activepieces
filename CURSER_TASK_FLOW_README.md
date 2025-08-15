## Activepieces — Local Dev Environment & New Piece Workflow

### Scope
- **Goal**: Set up local dev, generate a new piece, add auth, create an action and a trigger, expose them, rebuild, and test.
- **Audience**: Developers building pieces in this repo.

### Prerequisites
- **Node.js**: v18+
- **npm**: v9+

### One-time Setup
1) **Initialize dev environment**

```bash
node tools/setup-dev.js
```

2) **Start backend + UI (SQLite + in-memory queue)**

```bash
npm start
```

- Open `http://localhost:4200`
- Login: Email `dev@ap.com`, Password `12345678`

### Make Pieces Available During Dev
- Pieces are gated in dev via `AP_DEV_PIECES` (comma-separated piece folder names).
- Edit `packages/server/api/.env` and set:

```env
AP_DEV_PIECES=google-sheets,cal-com
```

- Alternatively, run with an inline env var:

```bash
AP_DEV_PIECES=google-sheets,cal-com npm start
```

Keep your new piece’s folder name included here, or it won’t be built in dev.

### Generate a New Piece
Run the generator and answer prompts:

```bash
npm run cli pieces create
```

Prompts:
- **Piece Name**: unique identifier (e.g., `gelato`)
- **Package Name**: optional npm package name (e.g., `@activepieces/piece-gelato`)
- **Piece Type**: `community` or `custom`

Output structure (example):
- `packages/pieces/community/<piece-folder>/`
  - `src/index.ts` with `createPiece({ displayName, logoUrl, auth, actions, triggers })`

### Add Authentication (optional)
- Define `auth` in your piece (e.g., API Key):

```ts
export const myPieceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});
```

- Attach to `createPiece({ auth: myPieceAuth, ... })`.

### Create an Action
1) Generate an action:

```bash
npm run cli actions create
```

Prompts:
- **Piece Folder Name**: the folder under `packages/pieces/...` (e.g., `gelato`)
- **Action Display Name** and **Description**

2) The generator creates `src/lib/actions/<your-action>.ts`. Implement with `createAction({ name, displayName, description, props, run })`.

3) Expose the action in your piece’s `src/index.ts`:

```ts
import { myAction } from './lib/actions/my-action';

export const myPiece = createPiece({
  // ...
  actions: [myAction],
  triggers: [],
});
```

### Create a Trigger
1) Generate a trigger:

```bash
npm run cli triggers create
```

2) The generator creates `src/lib/triggers/<your-trigger>.ts`. Implement per trigger type and lifecycle.

3) Expose the trigger in `src/index.ts`:

```ts
import { myTrigger } from './lib/triggers/my-trigger';

export const myPiece = createPiece({
  // ...
  actions: [/* existing actions */],
  triggers: [myTrigger],
});
```

### Rebuild & Test
- Ensure your piece name is in `AP_DEV_PIECES`.
- After edits, restart the backend (`Ctrl+C` then `npm start`) and refresh the UI to pick up changes.
- To diagnose build issues for your piece only:

```bash
npx nx run-many -t build --projects=<piece-folder-name>
```

- Test via the Flow Builder in the UI:
  - For actions: configure auth/props and run.
  - For triggers: use “Load sample data” (where applicable).

### Key Paths & Files
- **Dev gating**: `packages/server/api/.env` → `AP_DEV_PIECES`
- **Piece root**: `packages/pieces/(community|custom)/<piece-folder>/`
- **Entry**: `src/index.ts`
- **Actions directory**: `src/lib/actions/`
- **Triggers directory**: `src/lib/triggers/`

### References
- Getting Started: [activepieces.com/docs/developers/development-setup/getting-started](https://www.activepieces.com/docs/developers/development-setup/getting-started)
- Local Dev Environment: [activepieces.com/docs/developers/development-setup/local](https://www.activepieces.com/docs/developers/development-setup/local)
- Create Piece Definition: [activepieces.com/docs/developers/building-pieces/piece-definition](https://www.activepieces.com/docs/developers/building-pieces/piece-definition)
- Add Piece Authentication: [activepieces.com/docs/developers/building-pieces/piece-authentication](https://www.activepieces.com/docs/developers/building-pieces/piece-authentication)
- Create Action: [activepieces.com/docs/developers/building-pieces/create-action](https://www.activepieces.com/docs/developers/building-pieces/create-action)
- Create Trigger: [activepieces.com/docs/developers/building-pieces/create-trigger](https://www.activepieces.com/docs/developers/building-pieces/create-trigger)


