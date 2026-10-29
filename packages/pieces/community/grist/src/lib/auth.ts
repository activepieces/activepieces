import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { GristAPIClient } from './common/helpers';

export const gristAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
	Log in to your Grist account. Navigate to the account menu at the top right, and select **Profile Settings** to manage or create your API Key.
	In the **Domain URL** field, enter the domain URL of your Grist instance.For example,if you have team site it will be "https://team.getgist.com".`,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain URL',
      required: true,
      defaultValue: 'https://docs.getgrist.com',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const authValue = auth;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      await client.listOrgs();

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Please provide valid API key and domain URL.',
      };
    }
  },
});
