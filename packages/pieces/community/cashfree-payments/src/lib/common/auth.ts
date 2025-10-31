import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const cashfreeAuth = PieceAuth.CustomAuth({
  description: 'Choose your Cashfree authentication method',
  props: {
    authType: Property.StaticDropdown({
      displayName: 'Authentication Type',
      description: 'Choose between Client ID/Secret or Bearer Token',
      required: true,
      defaultValue: 'client_credentials',
      options: {
        disabled: false,
        options: [
          {
            label: 'Client ID & Secret',
            value: 'client_credentials',
          },
          {
            label: 'Bearer Token',
            value: 'bearer_token',
          },
        ],
      },
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Choose the environment for API calls',
      required: true,
      defaultValue: 'sandbox',
      options: {
        disabled: false,
        options: [
          {
            label: 'Sandbox',
            value: 'sandbox',
          },
          {
            label: 'Production',
            value: 'production',
          },
        ],
      },
    }),
    clientId: Property.ShortText({
      displayName: 'Cashfree Client ID',
      description: 'Your Cashfree Payment Gateway Client ID',
      required: false,
    }),
    clientSecret: Property.ShortText({
      displayName: 'Cashfree Client Secret',
      description: 'Your Cashfree Payment Gateway Client Secret',
      required: false,
    }),
    bearerToken: Property.ShortText({
      displayName: 'Bearer Token',
      description: 'Your Cashfree Bearer Token',
      required: false,
    }),
  },
  required: true,
});
