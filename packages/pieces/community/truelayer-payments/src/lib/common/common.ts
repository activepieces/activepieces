import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const trueLayerCommon = {
  baseUrl: 'https://api.truelayer-sandbox.com',
  auth: PieceAuth.OAuth2({
    description: 'Authentication for TrueLayer API',
    authUrl: 'https://auth.truelayer-sandbox.com/?response_type=code&scope=info%20accounts%20balance%20cards%20transactions%20direct_debits%20standing_orders%20offline_access%20signupplus%20verification&response_mode=form_post&providers=uk-cs-mock%20uk-ob-all%20uk-oauth-all',
    tokenUrl: 'https://auth.truelayer-sandbox.com/connect/token',
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