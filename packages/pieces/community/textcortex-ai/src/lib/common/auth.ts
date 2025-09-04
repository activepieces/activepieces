import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

// For typing purposes in the client
export const TextCortexAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your TextCortex API Bearer Token.',
  required: true,
});

export const textCortexAuth = PieceAuth.CustomAuth({
  description: `
  Please follow these steps to get your TextCortex API token:
  
  1. Log in to your TextCortex account.
  2. Navigate to your account settings or API section.
  3. Generate or copy your API Bearer Token.
  4. Use this token in the format: Bearer {your-token}`,
  props: {
    token: TextCortexAuth,
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.textcortex.com/v1/account',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.token
        },
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json'
        }
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token',
      };
    }
  },
  required: true,
});
