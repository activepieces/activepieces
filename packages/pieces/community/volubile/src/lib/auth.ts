import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const volubileAuth = PieceAuth.CustomAuth({
  description:
    'You can retrieve your Volubile API key within your Volubile [Account Settings](https://eu.volubile.ai/settings/integrations).',
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      options: {
        disabled: true,
        options: [
          {
            label: 'EU API',
            value: 'https://api.eu.volubile.ai/v1',
          },
        ],
      },
    }),
  }
});
