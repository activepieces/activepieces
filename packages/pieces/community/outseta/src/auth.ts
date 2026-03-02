import { PieceAuth, Property } from '@activepieces/pieces-framework';

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
});
