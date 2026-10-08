import { PieceAuth } from '@activepieces/pieces-framework';

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
});
