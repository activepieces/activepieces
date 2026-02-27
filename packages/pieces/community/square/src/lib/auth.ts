import { PieceAuth } from '@activepieces/pieces-framework';

export const squareAuth = PieceAuth.OAuth2({
  description: 'Authentication',
  authUrl: 'https://connect.squareup.com/oauth2/authorize',
  tokenUrl: 'https://connect.squareup.com/oauth2/token',
  required: true,
  scope: [
    'MERCHANT_PROFILE_READ',
    'CUSTOMERS_READ',
    'CUSTOMERS_WRITE',
    'ITEMS_READ',
    'ITEMS_WRITE',
    'ORDERS_READ',
    'ORDERS_WRITE',
    'PAYMENTS_READ',
    'INVOICES_READ',
    'APPOINTMENTS_READ',
    'APPOINTMENTS_WRITE',
  ],
});
