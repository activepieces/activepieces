import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
} from '@activepieces/pieces-framework';

export const descriptAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: [
    'To create an API token:',
    '1. Open **Settings** in Descript.',
    '2. Select **API tokens** from the sidebar.',
    '3. Click **Create token**, give it a name, select a Drive, and click **Create token**.',
    '4. Copy the token and paste it here — you can only view it once.',
  ].join('\n'),
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://descriptapi.com/v1/status',
        headers: {
          Authorization: `Bearer ${getAuthToken(auth)}`,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API token. Please check and try again.',
      };
    }
  },
});

export function getAuthToken(
  auth: string | AppConnectionValueForAuthProperty<typeof descriptAuth>
): string {
  const raw = typeof auth === 'string' ? auth : auth.secret_text;
  return raw.trim();
}
