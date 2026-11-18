import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { squareClient } from './common/client';

export const SQUARE_SCOPES = [
  'MERCHANT_PROFILE_READ',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'ITEMS_READ',
  'ITEMS_WRITE',
  'ORDERS_READ',
  'ORDERS_WRITE',
  'PAYMENTS_READ',
  'PAYMENTS_WRITE',
  'INVENTORY_READ',
  'INVENTORY_WRITE',
  'EMPLOYEES_READ',
];

export const squareAuth = PieceAuth.OAuth2({
  description:
    'Sign in with the Square seller account you want to automate (production accounts only). Connections created before piece version 1.0.0 do not have the payment, inventory and team permissions: reconnect Square to use those actions.',
  authUrl: 'https://connect.squareup.com/oauth2/authorize',
  tokenUrl: 'https://connect.squareup.com/oauth2/token',
  required: true,
  scope: SQUARE_SCOPES,
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const merchantId = auth.data['merchant_id'] || 'me';
      const response = await httpClient.sendRequest<SquareMerchant>({
        method: HttpMethod.GET,
        url: `${squareClient.BASE_URL}/v2/merchants/${encodeURIComponent(merchantId)}`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Square-Version': squareClient.SQUARE_VERSION,
        },
        timeout: 5000,
      });
      return response.body?.merchant?.business_name || undefined;
    } catch {
      return undefined;
    }
  },
});

type SquareMerchant = { merchant?: { business_name?: string } };
