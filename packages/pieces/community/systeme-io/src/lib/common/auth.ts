import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const systemeIoAuth = PieceAuth.CustomAuth({
  description: 'Authentication for Systeme.io',
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Systeme.io API key',
      required: true,
    }),
  },
});
