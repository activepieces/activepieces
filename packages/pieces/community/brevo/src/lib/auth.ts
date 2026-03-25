import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const brevoAuth = PieceAuth.SecretText({
  displayName: 'Brevo API Key',
  description: 'API key from Brevo. Verified against Brevo v3 docs using the `api-key` header.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.brevo.com/v3/account',
        headers: {
          'api-key': auth,
          accept: 'application/json',
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Brevo API key.',
      };
    }
  },
});
