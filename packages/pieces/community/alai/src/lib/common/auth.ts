import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { AlaiApiError, alaiClient } from './client';

const markdownDescription = `
To get your Alai API key:

1. Sign in at [app.getalai.com](https://app.getalai.com).
2. Open the account menu and choose **API**.
3. Click **Add new API key**, name it (for example "Activepieces") and copy the key.
4. Paste it below.

API calls use the same AI credits as the Alai app.
`;

export const alaiAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Alai API key.',
      required: true,
    }),
  },
  async validate({ auth }) {
    try {
      await alaiClient.request({ apiKey: auth.apiKey, method: HttpMethod.GET, path: '/ping' });
      return { valid: true };
    } catch (error) {
      if (error instanceof AlaiApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid Alai API key.' };
      }
      return { valid: false, error: 'Could not reach the Alai API to check the key. Try again later.' };
    }
  },
});
