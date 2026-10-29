import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const trueLayerCommon = {
  baseUrl: 'https://api.truelayer.com',
  auth: PieceAuth.OAuth2({
    description: 'Authentication for TrueLayer API',
    authUrl:'https://auth.truelayer.com',
    tokenUrl: 'https://auth.truelayer.com/connect/token',
    required: true,
    scope: [
      'info',
      'accounts',
      'balance',
      'cards',
      'transactions',
      'direct_debits',
      'standing_orders',
      'offline_access',
      'signupplus',
      'verification'
    ],
    getConnectionIdentifier: async ({ auth }) => {
      try {
        const response = await httpClient.sendRequest<TrueLayerInfo>({
          method: HttpMethod.GET,
          url: 'https://api.truelayer.com/data/v1/info',
          headers: { Authorization: `Bearer ${auth.access_token}` },
          timeout: 5000,
        });
        return response.body?.results?.[0]?.full_name || undefined;
      } catch {
        return undefined;
      }
    },
  })
};

type TrueLayerInfo = { results?: { full_name?: string }[] };