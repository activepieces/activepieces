import { PieceAuth } from '@activepieces/pieces-framework';
import { listConnections } from './common/client';

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

export const publoraAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'You can generate an API key in your **Publora dashboard → Settings → API**.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await listConnections(auth);
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
