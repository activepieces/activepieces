# Authentication Patterns

## API Key (SecretText)

Most common for simple APIs. The `auth` value is a plain string.

```typescript
import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const myAppAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Get your API key from https://app.example.com/settings/api',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.example.com/v1/me',
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});
```

**Access in actions/triggers:** `context.auth` is a string directly.

**Real example:** `packages/pieces/community/stripe/src/index.ts`

---

## OAuth2

For services like Google, Slack, GitHub that use OAuth2 authorization flows.

```typescript
import { PieceAuth } from '@activepieces/pieces-framework';

export const myAppAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://app.example.com/oauth/authorize',
  tokenUrl: 'https://app.example.com/oauth/token',
  scope: ['read', 'write'],
  // Optional settings:
  // pkce: true,
  // pkceMethod: 'S256',
  // prompt: 'consent',
  // grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  // authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  // extra: { audience: 'https://api.example.com' },
});
```

**Access in actions/triggers:** `context.auth.access_token`

For custom API call actions with OAuth2:
```typescript
createCustomApiCallAction({
  baseUrl: () => 'https://api.example.com',
  auth: myAppAuth,
  authMapping: async (auth) => ({
    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
  }),
})
```

**Real example:** `packages/pieces/community/github/src/index.ts`

---

## Basic Auth

For APIs using username/password authentication.

```typescript
import { PieceAuth } from '@activepieces/pieces-framework';

export const myAppAuth = PieceAuth.BasicAuth({
  displayName: 'Connection',
  required: true,
  username: {
    displayName: 'Username',
    description: 'Your account username',
  },
  password: {
    displayName: 'Password',
    description: 'Your account password',
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.example.com/v1/me',
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.username,
          password: auth.password,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid credentials' };
    }
  },
});
```

**Access:** `context.auth.username`, `context.auth.password`

---

## Custom Auth

For APIs needing multiple fields (e.g., instance URL + API key, or region + credentials).

```typescript
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const myAppAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Instance URL',
      description: 'e.g. https://mycompany.example.com',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.base_url}/api/v1/me`,
        headers: { Authorization: `Bearer ${auth.api_key}` },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid connection details' };
    }
  },
});
```

**Access:** `context.auth.base_url`, `context.auth.api_key`

**Allowed prop types in CustomAuth:** ShortText, LongText, SecretText, Number, Checkbox, StaticDropdown, StaticMultiSelectDropdown, MarkDown.

**Real example:** `packages/pieces/community/wordpress/src/index.ts`

---

## No Auth

For public APIs or utility pieces that don't need credentials.

```typescript
// In createPiece():
auth: PieceAuth.None(),
```

When auth is `None`:
- Do NOT add `auth:` to `createAction()` / `createTrigger()`
- Do NOT reference `context.auth` in the `run` function
- Dropdowns do NOT receive an `auth` parameter

**Real example:** `packages/pieces/core/qrcode/src/index.ts`
