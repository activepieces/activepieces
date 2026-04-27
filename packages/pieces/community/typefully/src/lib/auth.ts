import { PieceAuth } from '@activepieces/pieces-framework';
import { typefullyApiCall } from './common/client';
import { HttpMethod } from '@activepieces/pieces-common';

function isHttpError(e: unknown): e is { response: { status: number } } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    typeof (e as Record<string, unknown>)['response'] === 'object' &&
    (e as Record<string, unknown>)['response'] !== null &&
    'status' in (e as Record<string, Record<string, unknown>>)['response']
  );
}

export const typefullyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'You can obtain your API key from **Typefully Settings → API**.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await typefullyApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/me',
      });

      return {
        valid: true,
      };
    } catch (e) {
      if (isHttpError(e) && e.response.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key.',
        };
      }
      return {
        valid: false,
        error: `Could not validate API key: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  },
});
