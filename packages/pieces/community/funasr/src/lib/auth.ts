import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const funasrAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: 'Configure your FunASR server connection.',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'The URL where your FunASR server is running (e.g. http://localhost:8000). Include the protocol and port.',
      required: true,
      defaultValue: 'http://localhost:8000',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key (optional)',
      description: 'If your FunASR server requires an API key, enter it here. Leave empty for local no-auth setups.',
      required: false,
    }),
  },
});
