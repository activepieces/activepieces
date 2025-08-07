import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const openphoneAuth = PieceAuth.CustomAuth({
  displayName: 'OpenPhone Authentication',
  description: 'Enter your OpenPhone API key',
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your OpenPhone API key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'OpenPhone API base URL',
      required: true,
      defaultValue: 'https://api.openphone.com/v1',
    }),
  },
});
