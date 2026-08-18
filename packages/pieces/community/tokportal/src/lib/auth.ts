import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalApiCall } from './common/client';

export const tokportalAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Sign in to [app.tokportal.com](https://app.tokportal.com), open **Developer → API keys** and create a key. It starts with \`sk_\` and is shown only once.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await tokportalApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/me',
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid TokPortal API key.' };
    }
  },
});
