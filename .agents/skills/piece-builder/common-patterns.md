# HTTP Client & Common Patterns

Where the code goes is set by `piece-layout.md`:
- `httpClient` is called **only** in `common/client.ts`.
- Every endpoint is a function in `common/api.ts`.
- Actions, triggers and dropdowns call `myAppApi.*`.

This file covers the `httpClient` options you'll use inside `client.ts`, plus the custom API call action and error handling.

## HTTP Client

Always use `httpClient` from `@activepieces/pieces-common`, and only inside `common/client.ts`:

```typescript
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
```

### Bearer Token

```typescript
const response = await httpClient.sendRequest<T>({
  method,
  url: `${baseUrl({ auth })}${path}`,
  authentication: {
    type: AuthenticationType.BEARER_TOKEN,
    token: auth.secret_text,
  },
  queryParams: query,
  body,
});
// response.body, response.status, response.headers
```

### Basic Auth

```typescript
const response = await httpClient.sendRequest<T>({
  method,
  url: `${baseUrl({ auth })}${path}`,
  authentication: {
    type: AuthenticationType.BASIC,
    username: auth.username,
    password: auth.password,
  },
});
```

### Custom Headers (no authentication helper)

```typescript
const response = await httpClient.sendRequest<T>({
  method,
  url: `${baseUrl({ auth })}${path}`,
  headers: {
    'X-Api-Key': auth.secret_text,
    'X-Custom-Header': 'value',
  },
});
```

Whichever form the vendor needs, write it once in `myAppClient.request`. Endpoint functions in `api.ts` never repeat it.

---

## Shared API helper and pagination

These live in `common/client.ts` (`request`, `paginate`, `baseUrl`) and `common/api.ts` (one function per endpoint). Copy the blueprints from `piece-layout.md`. That file has both the HTTP variant and the SDK variant.

Pagination rules:
- `paginate` always takes a `maxItems` cap with a default. Without one, a single dropdown on a large account fires thousands of requests.
- Write the loop the way the vendor pages: offset, page number, cursor, or next link.
- List actions that expose `limit` to the user make one request with that limit. They don't call `paginate`.

---

## Custom API Call Action

Always add this to give power users a generic HTTP action. Take the base URL from `myAppClient.baseUrl`, so it's defined in one place:

```typescript
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { myAppClient } from './lib/common/client';

// In createPiece actions array:
createCustomApiCallAction({
  baseUrl: (auth) => (auth ? myAppClient.baseUrl({ auth }) : ''),
  auth: myAppAuth,
  // `auth` is the connection object — read auth.secret_text (SecretText), not bare `${auth}`.
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.secret_text}`,
  }),
})
```

For OAuth2 auth, `auth` is typed from `auth: myAppAuth`, so read `auth.access_token` directly:
```typescript
createCustomApiCallAction({
  baseUrl: (auth) => (auth ? myAppClient.baseUrl({ auth }) : ''),
  auth: myAppAuth,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.access_token}`,
  }),
})
```

---

## Error Handling

### In `client.ts`: pass errors through

- **Don't wrap `HttpError` in a plain `Error`.** Its message already includes the status and response body, which `run()` shows to the user. Callers also need `error.response.status` to branch on.
- **SDK errors pass through the same way.**

### In `api.ts`: turn expected statuses into values

When a status is an expected outcome, catch it in the endpoint function and return a value. For example, a 404 on a lookup means "not found":

```typescript
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
```

Actions then branch on the value (`if (!task)`), never on HTTP status.

### In actions

Errors thrown in `run()` are shown to the user automatically. Add context only when the vendor's message alone wouldn't tell the user what to do:

```typescript
async run({ auth, propsValue }) {
  const task = await myAppApi.findTask({ auth, taskId: propsValue.taskId });
  if (!task) {
    throw new Error(`Task ${propsValue.taskId} was not found. Check the ID or pick the task from the dropdown.`);
  }
  return task;
}
```

### In dropdowns

Return a disabled state with a message, using the `disabledOptions` helper in `props.ts` (see `piece-layout.md`):

```typescript
options: async ({ auth }) => {
  if (!auth) {
    return disabledOptions({ placeholder: 'Please connect your account first.' });
  }
  const { data: projects, error } = await tryCatch(() => myAppApi.listProjects({ auth }));
  if (error) {
    return disabledOptions({ placeholder: 'Failed to load projects. Check your connection.' });
  }
  return { disabled: false, options: projects.map((project) => ({ label: project.name, value: project.id })) };
}
```
