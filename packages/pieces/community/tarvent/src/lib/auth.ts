import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { TarventApiError, tarventTransport } from './common/transport';

const authGuide = `
To obtain your Tarvent Account ID and API Key, follow these steps:

1. Log in to your Tarvent account.
2. Go to **Account->API Keys** section.
3. **Create an API key** and copy it. Give it permission for everything your flows use (contacts, audiences, campaigns, journeys, webhooks, transactions). A key limited to some areas (for example transactional email only) still connects; actions outside its permissions fail with a permission error.
4. The **Account ID** is available to copy at the top right.

Note: the Transactional Email API (Send A Transactional Email) is a paid Tarvent add-on that uses email API credits.
`;

export const tarventAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await tarventTransport.graphql({
        auth,
        query: 'query ValidateConnection { audiences(first: 1) { nodes { id } } }',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof TarventApiError && error.isUnauthorized) {
        return { valid: false, error: tarventTransport.invalidCredentialsMessage };
      }
      if (error instanceof TarventApiError && error.code === tarventTransport.permissionCode) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Could not verify the Tarvent connection: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  },
});
