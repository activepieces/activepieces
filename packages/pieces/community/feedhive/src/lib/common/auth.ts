import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const feedhiveAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your FeedHive API key:
1. Log in to your FeedHive account
2. Go to **Settings** → **Account** (or **Workspace**)
3. Find the **API Key** section and copy your key

Your key starts with \`fh_\`.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.feedhive.com/status',
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Make sure you copied it correctly from FeedHive Settings.',
      };
    }
  },
});
