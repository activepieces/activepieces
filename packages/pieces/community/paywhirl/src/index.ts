import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { paywhirlAuth } from './lib/common/auth';
import { cancelSubscription } from './lib/actions/cancel-subscription';
import { createCustomer } from './lib/actions/create-customer';
import { getCustomer } from './lib/actions/get-customer';
import { subscribeCustomer } from './lib/actions/subscribe-customer';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { searchCustomersSubscription } from './lib/actions/search-customers-subscription';
import { BASE_URL } from './lib/common/client';
import { PieceCategory } from '@activepieces/shared';

export const paywhirl = createPiece({
  displayName: 'Paywhirl',
  auth: paywhirlAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/paywhirl.png',
  description:
    'PayWhirls intuitive tools make recurring billing easy. Sell subscriptions, pre-orders, payment plans, or whatever billing arrangements you can dream up.',
  categories: [PieceCategory.ACCOUNTING, PieceCategory.PAYMENT_PROCESSING],
  authors: ['sanket-a11y'],
  actions: [
    cancelSubscription,
    createCustomer,
    getCustomer,
    searchCustomersSubscription,
    subscribeCustomer,
    createCustomApiCallAction({
      auth: paywhirlAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'api-key': auth.props.api_key,
          'api-secret': auth.props.api_secret,
        };
      },
    }),
  ],
  triggers: [],
});
