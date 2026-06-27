import { PieceAuth, Property } from '@activepieces/pieces-framework';

const authDescription = `
Enter your Extensiv API credentials.

You'll need:
- Base URL
- Client ID
- Client Secret
- User Login

These credentials are used to authenticate with the Extensiv 3PL Warehouse Manager API.
`;

export const extensivAuth = PieceAuth.CustomAuth({
  description: authDescription,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'Example: https://secure-wms.com',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      required: true,
    }),
    userLogin: Property.ShortText({
      displayName: 'User Login',
      required: true,
    }),
  },

  async validate({ auth }) {
    if (!auth.baseUrl.startsWith('https://')) {
      return {
        valid: false,
        error: 'Base URL must start with https://',
      };
    }

    return {
      valid: true,
    };
  },
});