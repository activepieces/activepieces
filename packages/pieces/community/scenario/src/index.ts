import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BasicAuthConnectionValue } from '@activepieces/shared';

export const scenarioAuth = PieceAuth.BasicAuth({
  description:
    'Follow [these instructions](https://docs.scenario.com/docs/get-api-key) to get your API key',
  required: true,
  username: Property.ShortText({
    displayName: 'API access key',
    description: 'Starts with "api_"',
    required: true,
  }),
  password: PieceAuth.SecretText({
    displayName: 'API secret',
    required: true,
  }),
});

export const scenario = createPiece({
  displayName: 'Scenario',
  auth: scenarioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/scenario.png',
  authors: ['AdamSelene'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => `https://api.cloud.scenario.com/v1/`,
      auth: scenarioAuth,
      authMapping: async (auth) => {
        const { username, password } = auth as BasicAuthConnectionValue;
        return {
          Authorization: `Basic ${Buffer.from(
            `${username}:${password}`
          ).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [],
});
