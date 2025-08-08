import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { reportFieldChanged } from './lib/triggers/report-field-changed';

export const bambooHrAuth = PieceAuth.CustomAuth({
  required: true,
  description:
    'Follow [these instructions](https://documentation.bamboohr.com/docs/getting-started#authentication) to get your API key',
  props: {
    companyDomain: Property.ShortText({
      displayName: 'Company domain',
      description:
        'The subdomain used to access BambooHR. If you access BambooHR at https://mycompany.bamboohr.com, then the companyDomain is "mycompany"',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
  },
});

export const bambooHr = createPiece({
  displayName: 'BambooHR',
  auth: bambooHrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bamboohr.png',
  authors: ['AdamSelene'],
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://api.bamboohr.com/api/gateway.php/${
          (auth as { companyDomain: string }).companyDomain
        }/v1/`,
      auth: bambooHrAuth,
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString(
            'base64'
          )}`,
        };
      },
    }),
  ],
  triggers: [reportFieldChanged],
});
