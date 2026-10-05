# Piece Layout

Every piece uses the same tree, whether it talks to the vendor through `httpClient` or through the vendor's SDK. The only file that differs between the two is `common/client.ts`.

Examples use `myApp` as the piece name. Replace it with yours (`attioApi`, `slackClient`, ...).

## The tree

```
src/
  index.ts                createPiece only: imports each action/trigger directly, spreads myAppAiActions, adds the custom API call
  i18n/
  lib/
    auth.ts               PieceAuth + validate. Never inline in index.ts
    output-schemas.ts     all outputSchema constants
    actions/
      <verb>-<noun>.ts    create-task.ts, get-user.ts, list-projects.ts
      ai/
        index.ts          export const myAppAiActions = [...]
        <verb>-<noun>.ts
    triggers/
      <noun>-<event>.ts   task-created.ts, new-message.ts
    common/
      types.ts            auth value type + vendor shapes, type-only
      client.ts           transport: the only file that imports httpClient or the vendor SDK
      api.ts              one typed function per vendor endpoint: myAppApi
      props.ts            API-backed and shared props for human actions/triggers: myAppProps
      ai-props.ts         props shared by AI actions: myAppAiProps
      webhook.ts          only if the piece has webhook triggers: myAppWebhook
      utils.ts            only if needed: pure helpers shared by 2+ files: myAppUtils
```

- **Folder names are always plural**: `actions`, `triggers`.
- **File names are kebab-case** with no `.action.ts` / `.trigger.ts` suffix.
- **The tree stays flat.** There are no resource sub-folders (`actions/tasks/`), and no `constants.ts`, `helpers.ts`, `services/` or `models/`.
- **Only `actions/ai/` gets a barrel `index.ts`**, because it holds 50–80 actions. Human actions (median 5) and triggers (median 2) are imported one by one in `src/index.ts`, so that one file shows the piece's whole surface.

## Who may import what

| File | May import | Must not import |
|---|---|---|
| `actions/*`, `actions/ai/*`, `triggers/*` | `common/{api,props,ai-props,types,utils,webhook}`, `auth`, `output-schemas` | `httpClient`, the vendor SDK, `common/client`, `src/index.ts` |
| `common/props.ts`, `common/ai-props.ts` | `common/{api,types,utils}`, `auth` | `httpClient`, SDK, `common/client` |
| `common/webhook.ts` | `common/{api,types}` | `httpClient`, SDK |
| `common/api.ts` | `common/{client,types,utils}` | — |
| `common/client.ts` | `httpClient` **or** the SDK, `common/types` | — |
| `auth.ts` | `common/api`, used inside `validate` / `getConnectionIdentifier` | — |
| `common/types.ts`, `common/utils.ts` | `import type` only | any runtime import from the piece |

```
types.ts (type-only) ← client.ts ← api.ts ← auth.ts ← props.ts / ai-props.ts / webhook.ts ← actions, triggers ← src/index.ts
```

`auth.ts` sits above `api.ts` because `validate` calls the API. The graph stays acyclic as long as `types.ts` only uses `import type`.

## File shape

Every `common/` file has the same order:
1. imports
2. private functions
3. **one** `export const myAppX = { ... }`
4. private constants
5. types

Every function takes a single destructured object.

**Always `return await`** an async call, in actions (`return await myAppApi.createTask(...)`) as well as in `api.ts`. Never return the bare promise:
- The async frame stays in the stack trace when a run fails.
- A `try/catch` added around the call later still catches the rejection. Without `await`, it silently misses it.

---

## `common/types.ts`

```typescript
import type { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import type { myAppAuth } from '../auth';

export type MyAppAuthValue = AppConnectionValueForAuthProperty<typeof myAppAuth>;

export type MyAppProject = { id: string; name: string };
export type MyAppTask = { id: string; title: string; project_id: string; created_at: string };
export type MyAppWebhook = { id: string; secret: string };
export type MyAppPage<T> = { data: T[] };
```

- **The auth value is the full connection type.** `context.auth` from actions, triggers and dropdowns passes to `myAppApi` as-is.
- **Auth `validate` receives raw values** (a plain string for SecretText), so it builds the connection object before calling the API, e.g. `{ type: AppConnectionType.SECRET_TEXT, secret_text: auth }`. The per-auth-type table is in `auth-patterns.md`.
- **Naming:** every type carries the piece prefix. Both raw vendor shapes and the normalized shapes `api.ts` returns live here.
- **SDK pieces** re-export the SDK's own types (`export type { Task } from '@vendor/sdk'`) instead of redefining them.

## `common/client.ts`

This is the only file that imports `httpClient` or the vendor SDK. It works out the base URL and attaches auth, and it knows nothing about specific endpoints.

**Errors pass through unchanged.** `HttpError` already carries status and body, and many pieces branch on `error.response.status === 404`. Wrapping the error in a plain `Error` breaks that.

### HTTP piece

```typescript
import { AuthenticationType, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { MyAppAuthValue, MyAppPage } from './types';

function baseUrl({ auth }: { auth: MyAppAuthValue }): string {
  return 'https://api.example.com/v1';
}

async function request<T>({ auth, method, path, query, body }: RequestParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    queryParams: query,
    body,
  });
  return response.body;
}

async function paginate<T>({ auth, path, query, maxItems = MAX_ITEMS }: PaginateParams): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; items.length < maxItems; page++) {
    const response = await request<MyAppPage<T>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, page: String(page), per_page: String(PAGE_SIZE) },
    });
    items.push(...response.data);
    if (response.data.length < PAGE_SIZE) break;
  }
  return items.slice(0, maxItems);
}

export const myAppClient = { baseUrl, request, paginate };

const PAGE_SIZE = 100;
const MAX_ITEMS = 1000;

type RequestParams = { auth: MyAppAuthValue; method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
type PaginateParams = { auth: MyAppAuthValue; path: string; query?: QueryParams; maxItems?: number };
```

- **`baseUrl` takes `auth`** so pieces whose URL comes from a subdomain, region or instance URL in the auth fit the same shape. It is exported because `src/index.ts` passes it to `createCustomApiCallAction`.
- **`paginate` always has a cap.** Without one, a single dropdown on a large account fires thousands of requests. Write the loop the way the vendor pages (offset, page number, cursor, next link).
- **Pieces with more than one auth method** branch on the auth type inside `request`, and nowhere else.
- **Naming:** the functions keep short names (`request`, `paginate`). Callers reach them through the piece-named object (`myAppClient.request(...)`), which is unique across pieces and easy to grep.

### SDK piece

```typescript
import { WebClient } from '@slack/web-api';
import type { SlackAuthValue } from './types';

function create({ auth }: { auth: SlackAuthValue }): WebClient {
  return new WebClient(auth.access_token);
}

export const slackClient = { create };
```

- `api.ts` calls `slackClient.create({ auth }).conversations.list(...)`.
- SDK errors go up unchanged, like `HttpError`.
- Fixed SDK options (retries, base URL from auth) go inside `create`.
- The file exists so that `new WebClient(...)` is written in one place, not in every action and dropdown.

## `common/api.ts`

One typed function per vendor endpoint. Human actions, AI actions, dropdowns, webhooks and polling triggers all call `myAppApi.*`, so each endpoint is written exactly once.

```typescript
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { myAppClient } from './client';
import type { MyAppAuthValue, MyAppPage, MyAppProject, MyAppTask, MyAppWebhook } from './types';

async function getMe({ auth }: { auth: MyAppAuthValue }): Promise<{ email: string }> {
  return await myAppClient.request<{ email: string }>({ auth, method: HttpMethod.GET, path: '/me' });
}

async function listProjects({ auth }: { auth: MyAppAuthValue }): Promise<MyAppProject[]> {
  return await myAppClient.paginate<MyAppProject>({ auth, path: '/projects' });
}

async function createTask({ auth, projectId, title }: { auth: MyAppAuthValue; projectId: string; title: string }): Promise<MyAppTask> {
  const response = await myAppClient.request<{ data: MyAppTask }>({
    auth,
    method: HttpMethod.POST,
    path: `/projects/${projectId}/tasks`,
    body: { title },
  });
  return response.data;
}

async function findTask({ auth, taskId }: { auth: MyAppAuthValue; taskId: string }): Promise<MyAppTask | null> {
  try {
    const response = await myAppClient.request<{ data: MyAppTask }>({ auth, method: HttpMethod.GET, path: `/tasks/${taskId}` });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

async function listRecentTasks({ auth, projectId, limit }: { auth: MyAppAuthValue; projectId?: string; limit: number }): Promise<MyAppTask[]> {
  const response = await myAppClient.request<MyAppPage<MyAppTask>>({
    auth,
    method: HttpMethod.GET,
    path: '/tasks',
    query: { sort: '-created_at', limit: String(limit), ...(projectId ? { project_id: projectId } : {}) },
  });
  return response.data;
}

async function createWebhook({ auth, targetUrl, events }: { auth: MyAppAuthValue; targetUrl: string; events: string[] }): Promise<MyAppWebhook> {
  const response = await myAppClient.request<{ data: MyAppWebhook }>({ auth, method: HttpMethod.POST, path: '/webhooks', body: { url: targetUrl, events } });
  return response.data;
}

async function deleteWebhook({ auth, webhookId }: { auth: MyAppAuthValue; webhookId: string }): Promise<void> {
  await myAppClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/webhooks/${webhookId}` });
}

export const myAppApi = { getMe, listProjects, createTask, findTask, listRecentTasks, createWebhook, deleteWebhook };
```

- **Names:** functions are `verb + noun`, following the vendor's docs: `list*`, `get*`, `find*`, `create*`, `update*`, `delete*`.
- **Return values:** functions return **unwrapped** data (`MyAppTask[]`, never `{ data: [...] }`). Normalization that more than one caller needs (flattening values, mapping members) happens here, before returning.
- **HTTP status:** calls that care about a status catch `HttpError` here and return a value (`findTask` returns `null` on 404). Actions never inspect HTTP status.
- **SDK pieces** use the same file and the same signatures; only the bodies change (`slackClient.create({ auth }).conversations.list(...)`).
- **Size:** keep one file up to about 150 endpoints. Past that, split into `common/api/<resource>.ts` and merge them into a single `myAppApi` in `common/api/index.ts`, with no duplicate keys.

## `common/props.ts`

This file holds every `Dropdown`, `MultiSelectDropdown` and `DynamicProperties`, plus any static prop used by two or more files. Options come from `myAppApi`, never from `client`.

```typescript
import { DropdownState, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { myAppAuth } from '../auth';
import { myAppApi } from './api';

function projectId<R extends boolean>({ required, displayName = 'Project', description = 'The project to use.' }: PropParams<R>) {
  return Property.Dropdown({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      const projects = await myAppApi.listProjects({ auth });
      return { disabled: false, options: projects.map((project) => ({ label: project.name, value: project.id })) };
    },
  });
}

function taskId<R extends boolean>({ required, displayName = 'Task', description = 'A task in the selected project.' }: PropParams<R>) {
  return Property.Dropdown({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: ['projectId'],
    options: async ({ auth, projectId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      if (!projectId) {
        return disabledOptions({ placeholder: 'Please select a project first.' });
      }
      ...
    },
  });
}

function taskFields<R extends boolean>({ required, displayName = 'Fields', description }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: myAppAuth,
    displayName,
    description,
    required,
    refreshers: ['projectId'],
    props: async ({ auth, projectId }): Promise<DynamicPropsValue> => { ... },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const myAppProps = { projectId, taskId, taskFields };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
```

- **Props are always factories.** The same dropdown is required in Create and optional in a List filter, and it is labelled "Parent Project" in one place and "Project" in another. A factory keeps a single definition; a plain const forces near-copies.
- **Every factory has the same signature, `PropParams<R>`:**
  - `required` is mandatory.
  - `displayName` and `description` have defaults, overridden only when the context differs.
  - `ai-props.ts` reuses `PropParams`.
- **Keep the `<R extends boolean>` generic.** The framework types a prop's value from the literal `required`. With a plain `required: boolean`, `propsValue.projectId` becomes `string | undefined` even with `required: true`, which forces `!` or casts. The generic carries the literal through.
- **Empty dropdown states go through `disabledOptions({ placeholder })`.** Use it for every disabled state: not connected, parent not selected, failed to load. An empty result stays enabled (`{ disabled: false, options: [], placeholder: 'No projects found.' }`), so it doesn't use the helper. It is a private helper in `props.ts`, not part of `myAppProps`. It returns `DropdownState<never>`, which fits any dropdown's option type without a cast. Give each case its own message so the user knows what to do next.
- **The key equals the factory name:** `projectId: myAppProps.projectId({ required: true })`. Dependent dropdowns hard-code their parent's key in `refreshers` (`taskId` refreshes on `['projectId']`), and this convention is what keeps that contract true. Don't make `refreshers` a parameter, and don't explain the contract in `description`, which is shown to users.

## `common/ai-props.ts`

This file holds props shared by `actions/ai/*`. Only AI actions import it.

- **Plain typed inputs only.** An agent fills them in itself: IDs as `ShortText`, plus `StaticDropdown`, `Number` and `Json`. Network-backed dropdowns don't belong here.
- **Descriptions are written for the model:** what the value is, where to get it, and the default.

```typescript
import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function projectId<R extends boolean>({ required, displayName = 'Project', description = 'Project ID, e.g. "prj_123". Use List Projects to find it.' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({ required, displayName = 'Limit', description = 'Max items to return (1-100). Defaults to 50.' }: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const myAppAiProps = { projectId, limit };
```

The same concept has the same key in human and AI actions (`projectId` in both), so the two schemas line up.

## `common/webhook.ts`

This file is only needed for pieces with webhook triggers. It holds the subscribe / unsubscribe / verify routine that every webhook trigger would otherwise copy. Each trigger keeps only its event name and its payload mapping.

```typescript
import { Store } from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { myAppApi } from './api';
import type { MyAppAuthValue } from './types';

async function enable({ auth, store, webhookUrl, events }: EnableParams): Promise<void> {
  const webhook = await myAppApi.createWebhook({ auth, targetUrl: webhookUrl, events });
  await store.put<StoredWebhook>(STORE_KEY, { webhookId: webhook.id, secret: webhook.secret });
}

async function disable({ auth, store }: { auth: MyAppAuthValue; store: Store }): Promise<void> {
  const stored = await store.get<StoredWebhook>(STORE_KEY);
  if (stored) {
    await myAppApi.deleteWebhook({ auth, webhookId: stored.webhookId });
  }
}

async function verify({ store, signature, rawBody }: { store: Store; signature: string | undefined; rawBody: string }): Promise<boolean> {
  const stored = await store.get<StoredWebhook>(STORE_KEY);
  if (!stored || !signature) {
    return false;
  }
  const expected = createHmac('sha256', stored.secret).update(rawBody).digest('hex');
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const myAppWebhook = { enable, disable, verify };

const STORE_KEY = 'my_app_webhook';

type EnableParams = { auth: MyAppAuthValue; store: Store; webhookUrl: string; events: string[] };
type StoredWebhook = { webhookId: string; secret: string };
```

Polling triggers don't need this file. They call `myAppApi.list*` from inside the `Polling.items` callback.

## `common/utils.ts`

This file holds pure helpers that two or more files share: building a payload, formatting a date, parsing an ID, chunking text. "Pure" means no I/O, no `httpClient` and no `Property`, which is the rule that keeps this file from becoming a dumping ground. Export everything as one object: `export const myAppUtils = { toIsoDate, parseTaskUrl }`.

---

## Where things go

### Props

| Prop | Used by one file | Used by 2+ files |
|---|---|---|
| `ShortText`, `LongText`, `Number`, `Checkbox`, `Json`, `DateTime`, `File`, `Array`, `Object` | inline in that action's `props: {}` | `props.ts` / `ai-props.ts` |
| `StaticDropdown` | inline, with its options in a private const in the same file | `props.ts` / `ai-props.ts` |
| `Dropdown`, `MultiSelectDropdown`, `DynamicProperties` (call the API) | **always** `props.ts` | `props.ts` |

A static prop moves to `props.ts` when a second file needs it, not before. API-backed props always live there, so that an action never imports `myAppApi` just to fill a dropdown.

### Helpers

| Helper | Goes in |
|---|---|
| Used by one action or trigger | a private `function` in that file, below the exported action |
| Calls the vendor API | `api.ts`, as a new endpoint function |
| Reshapes vendor data the same way for every caller | `api.ts`, applied before returning |
| Pure, shared by 2+ files | `utils.ts` |
| Webhook signature / subscription | `webhook.ts` |

## Naming

### Exports

| Thing | Name |
|---|---|
| Action | `<verb><Noun>Action`, no piece prefix, e.g. `createTaskAction` |
| Trigger | `<noun><Event>Trigger`, no piece prefix, e.g. `taskCreatedTrigger` |
| `common/` objects | `myAppClient`, `myAppApi`, `myAppProps`, `myAppAiProps`, `myAppWebhook`, `myAppUtils` |
| Auth | `myAppAuth` |

### Prop keys

These rules apply to **new actions only. Existing keys never change.**
- Keys are camelCase and named after the value `run` receives. The key is also the factory name.
- Don't prefix keys with the piece name: `myAppProps.projectId`, not `myAppProjectId`.
- The default `displayName` is the plain noun ("Project"), even though the key is `projectId`.

| Value | Key |
|---|---|
| One ID (dropdown or text) | `<noun>Id`: `projectId`, `channelId` |
| Several IDs | `<noun>Ids`: `userIds` |
| A value that isn't an ID | name what it is: `projectSlug`, `userEmail`, `fileUrl` |
| A second prop of the same kind | qualify the noun: `parentProjectId`, `targetListId` |
| `DynamicProperties` | `<noun>Fields`: `taskFields` |
| Boolean | `is` / `include` / `should` + noun: `includeArchived`, `isPrivate` |
| Paging | `limit`, `offset`, `cursor`, `pageSize` |

## `src/index.ts`

```typescript
import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { myAppAuth } from './lib/auth';
import { myAppClient } from './lib/common/client';
import { createTaskAction } from './lib/actions/create-task';
import { myAppAiActions } from './lib/actions/ai';
import { taskCreatedTrigger } from './lib/triggers/task-created';

export const myApp = createPiece({
  ...
  auth: myAppAuth,
  actions: [
    createTaskAction,
    ...myAppAiActions,
    createCustomApiCallAction({
      auth: myAppAuth,
      baseUrl: (auth) => (auth ? myAppClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
    }),
  ],
  triggers: [taskCreatedTrigger],
});
```

`src/index.ts` is the one file outside `client.ts` that reads the base URL. Its `createCustomApiCallAction` calls `myAppClient.baseUrl`, so the base URL is never written twice.

## Converting an existing piece

A piece is converted to this layout when you **add an action or trigger** to it.

- **Bug fixes do not convert.** Make the smallest fix in the piece's current style.
- **The conversion is its own commit**, before the feature commit, so reviewers read the move as a move.
- **What must not change**, because live flows store these and changing one breaks every flow that uses the piece:
  - action and trigger `name`
  - prop keys
  - auth prop shape
  - output shape
  - the HTTP request itself (same URL, headers, body)
- **What may move freely:** files, folders and export identifiers.
- **Existing prop keys stay as they are,** even when they break the "key equals factory name" rule. If a factory's `refreshers` expects a different parent key than an existing action uses, keep that action's dropdown inline rather than renaming its key.
- **An existing user-facing error wrapper stays**, because removing it changes error text users already see.
- **Inline the old barrels:** existing `actions/index.ts` / `triggers/index.ts` barrels are replaced by direct imports in `src/index.ts`.

### Before you call the conversion done

- Each action and trigger has the same `name` and the same prop keys as before. Diff them.
- `grep -rlE "httpClient|from '<sdk>'|common/client" src/lib/actions src/lib/triggers` returns nothing.
- No `!` or `as` on `propsValue` for required factory props.
- Build and lint pass.
