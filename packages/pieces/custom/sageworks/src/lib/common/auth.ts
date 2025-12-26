import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const sageworksAuth = PieceAuth.CustomAuth({
  description: `
To obtain your Sageworks API credentials:

1. Contact Sageworks support to request API access
2. You will receive a **Client ID** and **Client Secret**
3. The API uses OAuth 2.0 client credentials flow
4. Base URL is typically: https://api.sageworks.com

Authentication details: https://api.sageworks.com/documentation/AnalystApi.html
  `,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'https://api.sageworks.com',
      description: 'The base URL for the Sageworks API',
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      required: true,
      description: 'Your Sageworks API Client ID',
    }),
    clientSecret: Property.ShortText({
      displayName: 'Client Secret',
      required: true,
      description: 'Your Sageworks API Client Secret',
    }),
  },
});

export type SageworksAuth = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};
