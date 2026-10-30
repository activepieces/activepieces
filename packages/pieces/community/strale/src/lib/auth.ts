import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const straleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Strale API key (starts with sk_live_). Get one free at https://strale.dev/signup. The Search action works without a key, and so do the free capabilities.',
  required: false,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: 'https://api.strale.io/v1/wallet/balance',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
