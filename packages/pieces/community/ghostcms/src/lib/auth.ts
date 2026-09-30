import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { GhostApiError, ghostClient } from './common/client';

const authMarkdown = `
To generate an API key, follow the steps below in GhostCMS:
1. Go to Settings -> Advanced -> Integrations.
2. Scroll down to Custom Integrations and click Add custom integration.
3. Enter integration name and click create.
4. Copy the API URL and the Admin API Key into the fields below.
`;

export const ghostAuth = PieceAuth.CustomAuth({
  description: authMarkdown,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'API URL',
      description:
        'The API URL of your application (https://test-publication.ghost.io)',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'Admin API Key',
      description: 'The admin API key for your application',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const urlProblem = baseUrlProblem(auth.baseUrl);
    if (urlProblem) {
      return { valid: false, error: urlProblem };
    }
    try {
      await ghostClient.request<unknown>({
        auth: { props: { baseUrl: auth.baseUrl, apiKey: auth.apiKey } },
        method: HttpMethod.GET,
        path: '/users/',
        query: { limit: 1 },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof GhostApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid Admin API Key. Copy the Admin API Key of the custom integration from Ghost Settings > Advanced > Integrations.' };
      }
      return {
        valid: false,
        error: error instanceof Error ? `Could not verify the connection: ${error.message}` : 'Could not verify the connection.',
      };
    }
  },
});

function baseUrlProblem(value: string): string | null {
  const parsed = parseUrl((value ?? '').trim());
  if (!parsed || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')) {
    return 'API URL must be the http(s) address of your Ghost site, e.g. https://your-site.ghost.io.';
  }
  if (parsed.username || parsed.password) {
    return 'API URL must not contain a username or password.';
  }
  return null;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
