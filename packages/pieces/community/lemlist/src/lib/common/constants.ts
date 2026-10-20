import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { isLemlistStatus, lemlistApiCall } from './client';

export const lemlistAuth = PieceAuth.SecretText({
  displayName: 'Lemlist API Key',
  description: `To get your API key:

1. In lemlist, click your profile picture (bottom left) and open **Settings**.
2. Go to **Integrations**.
3. Click **Generate** next to API key and copy it. You won't see it again.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await lemlistApiCall({ apiKey: auth, method: HttpMethod.GET, resourceUri: '/team' });
      return { valid: true };
    } catch (error) {
      if (isLemlistStatus({ error, status: 401 }) || isLemlistStatus({ error, status: 403 })) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: 'Could not reach lemlist to check the API key. Try again in a moment.',
      };
    }
  },
});
