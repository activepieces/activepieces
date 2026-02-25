import { PieceAuth } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { makeClient } from './common';

export const PredictLeadsAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
    To obtain your PredictLeads tokens, follow these steps:

    1. Have a PredictLeads account - Create a new user here: https://predictleads.com/sign_up.
    2. Go to: https://predictleads.com/subscriptions.
    3. In the subscription page, locate the API Key and Tokens section where you can also find the usage.
    `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The key of the Predict Leads account.',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'The token of the Predict Leads account.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(
        {
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        }
      );
      await client.findCompanyByDomain("google.com");
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token or API Key.',
      };
    }
  },
});
