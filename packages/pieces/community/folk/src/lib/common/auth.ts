import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';
import { FolkApiError, folkClient } from './client';

export const folkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Folk API key. You can view and manage your API keys in your workspace settings under the "API" section at https://app.folk.app/apps/contacts/network/settings/api-keys',
  required: true,
  validate: async ({ auth }) => {
    try {
      await folkClient.request<unknown>({
        auth: { secret_text: auth, type: AppConnectionType.SECRET_TEXT },
        method: HttpMethod.GET,
        path: '/v1/users/me',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof FolkApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API key. Check the key in folk → Settings → API and try again.' };
      }
      return {
        valid: false,
        error: 'Could not reach Folk to check the API key. Try again in a moment.',
      };
    }
  },
});
