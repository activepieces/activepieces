import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpError,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

function describeBody(body: unknown): string {
  if (typeof body === 'string') {
    return body.trim().slice(0, 300);
  }
  if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
    for (const [key, value] of Object.entries(body)) {
      if ((key === 'message' || key === 'error') && typeof value === 'string') {
        return value.slice(0, 300);
      }
    }
  }
  return '';
}

export const capsuleCrmAuth = PieceAuth.OAuth2({
  description: `
To connect Capsule CRM:
1. Open https://developer.capsulecrm.com/clients/new and sign in with GitHub.
2. Register a new application and add https://cloud.activepieces.com/redirect (or your own instance's redirect URL) as the redirect URI.
3. Copy the Client ID and Client Secret into this connection.
4. Sign in to Capsule CRM when prompted and approve access. Webhook triggers need a Capsule user with the Administrator role.`,
  authUrl: 'https://api.capsulecrm.com/oauth/authorise',
  tokenUrl: 'https://api.capsulecrm.com/oauth/token',
  required: true,
  scope: ['read', 'write'],
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.capsulecrm.com/api/v2/site',
        headers: { Accept: 'application/json' },
        timeout: 30_000,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof HttpError) {
        const status = error.response.status;
        const detail = describeBody(error.response.body);
        if (status === 401) {
          return { valid: false, error: `Invalid credentials: Capsule CRM rejected the access token (401)${detail ? `: ${detail}` : ''}.` };
        }
        return { valid: false, error: `Capsule CRM returned ${status} while checking the connection${detail ? `: ${detail}` : ''}.` };
      }
      const message = error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300);
      return { valid: false, error: `Could not reach Capsule CRM: ${message}` };
    }
  },
});

export type CapsuleCrmAuthType = OAuth2PropertyValue;
