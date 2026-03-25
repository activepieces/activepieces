import { PieceAuth } from '@activepieces/pieces-framework';

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
  })
};