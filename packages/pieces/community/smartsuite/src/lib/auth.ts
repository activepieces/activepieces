import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteApiCall } from './common';

export const smartsuiteAuth = PieceAuth.CustomAuth({
  description: `
  You can obtain API key by navigate to **My Profile->API Key** from top-right corner.
  
  You can obtain Account ID from browser URL.For example, if smartsuite workspace URL is https://app.smartsuite.com/xyz/home, your Account ID is **xyz**.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await smartSuiteApiCall({
        apiKey: auth.apiKey,
        accountId: auth.accountId,
        method: HttpMethod.GET,
        resourceUri: '/solutions',
      });

      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Credentials.',
      };
    }
  },
});
