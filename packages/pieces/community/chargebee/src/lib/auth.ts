import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { chargebeeRequest } from './common/client';

export const chargebeeAuth = PieceAuth.CustomAuth({
  displayName: 'Chargebee',
  description:
    'Go to Settings > Configure Chargebee > API Keys and Webhooks > API Keys tab. Click Add an API Key, select Full-Access Key, and copy the generated key.',
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
      description:
        'Go to Settings > Configure Chargebee > API Keys and Webhooks > API Keys tab. Click Add an API Key, select Full-Access Key, and copy the generated key.',
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
