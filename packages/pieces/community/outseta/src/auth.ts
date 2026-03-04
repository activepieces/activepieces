import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { OutsetaClient } from './common/client';

export const outsetaAuth = PieceAuth.Custom({
  description: 'Outseta Admin API credentials',
  props: {
    domain: Property.ShortText({
      displayName: 'Outseta domain',
      description: 'Example: https://yourcompany.outseta.com',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    apiSecret: Property.ShortText({
      displayName: 'API Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      try {
        const client = new OutsetaClient({
          domain: auth.domain,
          apiKey: auth.apiKey,
          apiSecret: auth.apiSecret,
        });

        await client.get<any>(`/api/v1/crm/people`);

        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key or secret key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
