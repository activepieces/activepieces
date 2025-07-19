import {
  AuthenticationType,
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@ensemble/pieces-common';
import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
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
  description: 'Revenue and churn analytics for Stripe',

  auth: saasticAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/saastic.png',
  categories: [PieceCategory.MARKETING],
  authors: ["joselupianez","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createCustomer,
    createCharge,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.saastic.com',
      auth: saasticAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
