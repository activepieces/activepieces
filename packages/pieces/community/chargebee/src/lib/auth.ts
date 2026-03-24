import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { chargebeeRequest } from './common/client';

export const chargebeeAuth = PieceAuth.CustomAuth({
  displayName: 'Chargebee',
  description:
    'Authenticate with your Chargebee site name and API key. The API is called against https://{site}.chargebee.com/api/v2 using HTTP Basic auth.',
  required: true,
  props: {
    site: Property.ShortText({
      displayName: 'Site',
      description:
        'Your Chargebee site subdomain. For acme.chargebee.com, enter acme.',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Chargebee API key from Settings → API Keys & Webhooks.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await chargebeeRequest({
        site: auth.site,
        apiKey: auth.api_key,
        method: HttpMethod.GET,
        path: '/customers?limit=1',
      });
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to validate Chargebee credentials.',
      };
    }
  },
});
