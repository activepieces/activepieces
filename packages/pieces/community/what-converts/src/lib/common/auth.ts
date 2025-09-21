import {
  PieceAuth,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

const whatConvertsAuthProps = {
  api_token: Property.ShortText({
    displayName: 'API Token',
    description: 'Your WhatConverts API Token.',
    required: true,
  }),
  api_secret: PieceAuth.SecretText({
    displayName: 'API Secret',
    description: 'Your WhatConverts API Secret.',
    required: true,
  }),
};

export const whatConvertsAuth = PieceAuth.CustomAuth({
  description: `
  To get your API credentials:
  1. Log in to your WhatConverts dashboard.
  2. Navigate to an account and select a profile.
  3. Select the **Tracking** dropdown menu.
  4. Click on **Integrations**, then **API Keys**.
  5. Click **Generate API Key** to get your Token and Secret.
  `,
  required: true,
  props: whatConvertsAuthProps,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${WHATCONVERTS_API_URL}/leads`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.api_token,
          password: auth.api_secret,
        },
        queryParams: {
          per_page: '1',
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid API Token or Secret. Please check your credentials and try again.',
      };
    }
  },
});

export type WhatConvertsAuth = StaticPropsValue<typeof whatConvertsAuthProps>;