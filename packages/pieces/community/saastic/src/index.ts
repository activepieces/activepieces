import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCharge } from './lib/actions/create-charge';
import { createCustomer } from './lib/actions/create-customer';

export const saasticAuth = PieceAuth.SecretText({
  description:
    ' You can find your project’s API key here: https://saastic.com/settings/developers',
  displayName: 'Api Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: 'https://api.saastic.com/beacon/customers',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API token',
      };
    }
  },
});

export const saastic = createPiece({
  displayName: 'Saastic',
  auth: saasticAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/saastic.png',
  authors: ['joselupianez'],
  categories: [PieceCategory.MARKETING],
  actions: [
    createCustomer,
    createCharge,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.saastic.com',
      auth: saasticAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
