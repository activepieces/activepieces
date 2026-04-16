import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { billsbyAuth } from './lib/auth';
import { createCustomerAction } from './lib/actions/create-customer';
import { getCustomerAction } from './lib/actions/get-customer';
import { createSubscriptionAction } from './lib/actions/create-subscription';

export const billsby = createPiece({
  displayName: 'Billsby',
  description:
    'Subscription billing and recurring payments platform.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/billsby.png',
  categories: [PieceCategory.COMMERCE],
  auth: billsbyAuth,
  authors: ['tarai-dl'],
  actions: [
    createCustomerAction,
    getCustomerAction,
    createSubscriptionAction,
  ],
  triggers: [],
});
