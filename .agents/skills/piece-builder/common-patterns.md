# HTTP Client & Common Patterns

## HTTP Client

Always use `httpClient` from `@activepieces/pieces-common`:

```typescript
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
```

### GET with Bearer Token

```typescript
const response = await httpClient.sendRequest<{ data: Item[] }>({
  method: HttpMethod.GET,
  url: 'https://api.example.com/v1/records',
  authentication: {
    type: AuthenticationType.BEARER_TOKEN,
    token: apiKey,
  },
  queryParams: { limit: '100', page: '1' },
});
// response.body, response.status, response.headers
```

### POST with Body

```typescript
const response = await httpClient.sendRequest({
  method: HttpMethod.POST,
  url: 'https://api.example.com/v1/records',
  authentication: {
    type: AuthenticationType.BEARER_TOKEN,
    token: apiKey,
  },
  body: { name: 'New Record', status: 'active' },
});
```

### Basic Auth

```typescript
const response = await httpClient.sendRequest({
  method: HttpMethod.GET,
  url: 'https://api.example.com/v1/records',
  authentication: {
    type: AuthenticationType.BASIC,
    username: 'user',
    password: 'pass',
  },
});
```

### Custom Headers (no authentication helper)

```typescript
const response = await httpClient.sendRequest({
  method: HttpMethod.GET,
  url: 'https://api.example.com/v1/records',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'X-Custom-Header': 'value',
  },
});
```

### Available HttpMethod values
`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

### Available AuthenticationType values
`BEARER_TOKEN`, `BASIC`

---

## Common API Helper Pattern

For pieces with many actions sharing API logic, create `src/lib/common/index.ts`:

```typescript
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { myAppAuth } from '../..';

const BASE_URL = 'https://api.example.com/v1';

// Centralized API call function
export async function myAppApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

// Reusable dropdown definitions
export const myAppCommon = {
  projectDropdown: Property.Dropdown({
    displayName: 'Project',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first' };
      }
      const response = await myAppApiCall<{ data: { id: string; name: string }[] }>({
        token: auth as string,
        method: HttpMethod.GET,
        path: '/projects',
      });
      return {
        disabled: false,
        options: response.body.data.map((p) => ({
          label: p.name,
          value: p.id,
        })),
      };
    },
  }),
};
```

Then use in actions:

```typescript
import { myAppCommon, myAppApiCall } from '../common';
import { myAppAuth } from '../../';

export const listTasksAction = createAction({
  auth: myAppAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Lists tasks in a project',
  props: {
    project: myAppCommon.projectDropdown,  // Reuse the dropdown
  },
  async run(context) {
    const response = await myAppApiCall<{ data: any[] }>({
      token: context.auth as string,
      method: HttpMethod.GET,
      path: `/projects/${context.propsValue.project}/tasks`,
    });
    return response.body;
  },
});
```

**Real examples:**
- `packages/pieces/community/github/src/lib/common/index.ts`
- `packages/pieces/community/stripe/src/lib/common/index.ts`

---

## Pagination Helper Pattern

For APIs returning paginated results:

```typescript
export async function myAppPaginatedApiCall<T>({
  token, method, path, queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | number>;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await myAppApiCall<{ data: T[]; has_more: boolean }>({
      token,
      method,
      path,
      queryParams: {
        ...queryParams,
        page: String(page),
        per_page: String(perPage),
      } as Record<string, string>,
    });
    results.push(...response.body.data);
    hasMore = response.body.has_more;
    page++;
  }

  return results;
}
```

**Real example:** `packages/pieces/community/github/src/lib/common/index.ts` -- `githubPaginatedApiCall`

---

## Custom API Call Action

Always add this to give power users a generic HTTP action:

```typescript
import { createCustomApiCallAction } from '@activepieces/pieces-common';

// In createPiece actions array:
createCustomApiCallAction({
  baseUrl: () => 'https://api.example.com/v1',
  auth: myAppAuth,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth}`,
  }),
})
```

For OAuth2 auth:
```typescript
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

createCustomApiCallAction({
  baseUrl: () => 'https://api.example.com',
  auth: myAppAuth,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
  }),
})
```

---

## Error Handling

### In Actions

Errors thrown in `run()` are shown to the user automatically. You can add context:

```typescript
async run(context) {
  try {
    const response = await httpClient.sendRequest({ /* ... */ });
    return response.body;
  } catch (error) {
    throw new Error(`Failed to create record: ${(error as Error).message}`);
  }
}
```

### In Dropdowns

Return a disabled state with a message:

```typescript
options: async ({ auth }) => {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your account first' };
  }
  try {
    const response = await httpClient.sendRequest({ /* ... */ });
    return { disabled: false, options: [...] };
  } catch (error) {
    return { disabled: true, options: [], placeholder: 'Failed to load options. Check connection.' };
  }
}
```
