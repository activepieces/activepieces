import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const checkoutComAuth = PieceAuth.SecretText({
  displayName: 'Secret Key',
  description: 'Your Checkout.com secret key. You can find it in the Checkout.com dashboard under Developers > API keys.',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.checkout.com/customers',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid Checkout.com secret key' };
    }
  },
}); 