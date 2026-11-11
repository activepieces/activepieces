import {
  AppConnectionValueForAuthProperty,
  OAuth2AuthorizationMethod,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  authorizationOf,
  isRecord,
  KlaviyoApiError,
  klaviyoApi,
  textOf,
  vendorMessage,
} from './client';

export const klaviyoAuth = [
  PieceAuth.SecretText({
    displayName: 'Private API Key',
    description: `Authenticate using your Klaviyo Private API Key.\n\n**Steps:**\n1. Log in to Klaviyo → go to **Settings → API Keys**\n2. Click **Create Private API Key**\n3. Choose **Custom Key** and give it these scopes (scopes can't be changed later):\n   - Accounts: Read\n   - Profiles: Read/Write\n   - Lists: Read/Write\n   - Segments: Read\n   - Subscriptions: Read/Write\n   - Events: Read/Write\n   - Metrics: Read\n   - Tags: Read/Write\n4. Copy the key (starts with \`pk_\`) and paste it below`,
    required: true,
    validate: async ({ auth }) => validateKey({ authorization: `Klaviyo-API-Key ${auth.trim()}` }),
    getConnectionIdentifier: async ({ auth }) =>
      fetchAccountLabel({ authorization: `Klaviyo-API-Key ${auth.trim()}` }),
  }),
  PieceAuth.OAuth2({
    description: `
To connect via OAuth2, follow the [Klaviyo OAuth setup guide](https://developers.klaviyo.com/en/docs/set_up_oauth) to register your app, then set the **Redirect URI** to {{redirectUrl}} and enable the following **scopes** in your app settings:
  - profiles:read
  - profiles:write
  - lists:read
  - lists:write
  - tags:read
  - tags:write
  - segments:read
  - events:read
  - events:write
  - metrics:read
  - subscriptions:read
  - subscriptions:write
  - accounts:read`,
    authUrl: 'https://www.klaviyo.com/oauth/authorize',
    tokenUrl: 'https://a.klaviyo.com/oauth/token',
    required: true,
    scope: [
      'profiles:read',
      'profiles:write',
      'lists:read',
      'lists:write',
      'tags:read',
      'tags:write',
      'segments:read',
      'events:read',
      'events:write',
      'metrics:read',
      'subscriptions:read',
      'subscriptions:write',
      'accounts:read',
    ],
    pkce: true,
    pkceMethod: 'S256',
    authorizationMethod: OAuth2AuthorizationMethod.HEADER,
    getConnectionIdentifier: async ({ auth }) =>
      fetchAccountLabel({ authorization: `Bearer ${auth.access_token}` }),
  }),
];

export function getAuthorizationHeader(auth: KlaviyoAuthValue): string {
  return authorizationOf(auth);
}

async function validateKey({ authorization }: { authorization: string }): Promise<{ valid: true } | { valid: false; error: string }> {
  try {
    await klaviyoApi.request({ authorization, method: HttpMethod.GET, path: '/accounts' });
    return { valid: true };
  } catch (error) {
    if (error instanceof KlaviyoApiError) {
      if (error.status === 401) {
        return { valid: false, error: `Invalid API key. Check the key in Klaviyo → Settings → API Keys. Klaviyo said: ${vendorMessage(error.responseBody)}` };
      }
      if (error.status === 403) {
        return { valid: false, error: `The key lacks the accounts:read scope. Create a key with the scopes listed above. Klaviyo said: ${vendorMessage(error.responseBody)}` };
      }
      return { valid: false, error: `Klaviyo returned HTTP ${error.status} while checking the key: ${vendorMessage(error.responseBody)}` };
    }
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchAccountLabel({ authorization }: { authorization: string }): Promise<string | undefined> {
  try {
    const response = await klaviyoApi.request({ authorization, method: HttpMethod.GET, path: '/accounts', timeoutMs: 5000 });
    const data = isRecord(response.body) ? response.body['data'] : undefined;
    const first = Array.isArray(data) ? data[0] : undefined;
    const attributes = isRecord(first) ? first['attributes'] : undefined;
    const contact = isRecord(attributes) ? attributes['contact_information'] : undefined;
    if (!isRecord(contact)) {
      return undefined;
    }
    return textOf(contact['organization_name']) ?? textOf(contact['default_sender_email']);
  } catch {
    return undefined;
  }
}

export type KlaviyoAuthValue = AppConnectionValueForAuthProperty<
  typeof klaviyoAuth
>;
