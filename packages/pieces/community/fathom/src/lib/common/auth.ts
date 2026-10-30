import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

const fathomOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Sign in with Fathom',
  description: 'Connect your Fathom account using OAuth2. Under OAuth, List Meetings cannot embed summaries or transcripts; use Get Recording Summary and Get Recording Transcript instead.',
  authUrl: 'https://fathom.video/external/v1/oauth2/authorize',
  tokenUrl: 'https://fathom.video/external/v1/oauth2/token',
  required: true,
  scope: ['public_api'],
});

const fathomApiKeyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Fathom API key:
1. Sign in to Fathom and open **Settings**.
2. Go to **API Access**.
3. Click **Generate API Key**, give it a name and copy the key.
4. Paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.fathom.ai/external/v1/teams',
        headers: { 'X-Api-Key': auth.trim(), Accept: 'application/json' },
        timeout: 30000,
      });
      return { valid: true };
    } catch (error) {
      const status = statusOf(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Fathom did not accept this API key. Generate a new one in Settings > API Access.' };
      }
      return { valid: false, error: `Could not reach Fathom to check the API key${status === undefined ? '' : ` (HTTP ${status})`}. Try again in a minute.` };
    }
  },
});

function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return undefined;
  }
  return typeof response.status === 'number' ? response.status : undefined;
}

export const fathomAuth = [fathomOAuth2Auth, fathomApiKeyAuth];

export type FathomAuthValue = AppConnectionValueForAuthProperty<typeof fathomAuth>;
