import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { REVIEWFLOWZ_API_BASE, REVIEWFLOWZ_APP_BASE } from './common/constants';

export const reviewflowzOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Reviewflowz account',
  description:
    'Sign in to Reviewflowz and pick the account to connect. If you belong to several accounts, the consent screen asks which one; the connection reads and writes that account only.',
  required: true,
  authUrl: `${REVIEWFLOWZ_APP_BASE}/oauth/authorize`,
  tokenUrl: `${REVIEWFLOWZ_APP_BASE}/oauth/token`,
  pkce: true,
  pkceMethod: 'S256',
  scope: [
    'sources:read',
    'sources:write',
    'reviews:read',
    'replies:read',
    'replies:write',
    'organize:read',
    'organize:write',
    'analytics:read',
    'analytics:write',
    'requests:read',
    'requests:write',
    'widgets:read',
    'widgets:write',
    'webhooks:read',
    'webhooks:write',
  ],
  getConnectionIdentifier: async ({ auth }) => connectionLabel(auth.access_token),
});

export const reviewflowzApiKeyAuth = PieceAuth.SecretText({
  displayName: 'API key',
  description: `For self-hosted Activepieces that can't use Reviewflowz sign-in.
1. In Reviewflowz, open **Webhooks & API** in your account settings (${REVIEWFLOWZ_APP_BASE}/api_tokens).
2. Click **+ Create a new API key**, keep **Full access**, and copy the key (it starts with \`rfz_live_\`).
3. Paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${REVIEWFLOWZ_API_BASE}/account`,
        headers: { Authorization: `Bearer ${auth}`, Accept: 'application/json' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Reviewflowz refused this API key. Check that you copied all of it and that it has not expired or been deleted.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => connectionLabel(auth),
});

export const reviewflowzAuth = [reviewflowzOAuth2Auth, reviewflowzApiKeyAuth];

async function connectionLabel(token: string): Promise<string | undefined> {
  try {
    const response = await httpClient.sendRequest<{ name?: string; member?: { name?: string } | null }>({
      method: HttpMethod.GET,
      url: `${REVIEWFLOWZ_API_BASE}/account`,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 5000,
    });
    const { name, member } = response.body;
    if (!name) {
      return undefined;
    }
    return member?.name ? `${name} (${member.name})` : name;
  } catch {
    return undefined;
  }
}
