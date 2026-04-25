import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { koFiAuth } from './lib/auth';
import { newCommission } from './lib/triggers/new-commission';
import { newDonation } from './lib/triggers/new-donation';
import { newShopOrder } from './lib/triggers/new-shop-order';
import { newSubscription } from './lib/triggers/new-subscription';

export const koFi = createPiece({
  displayName: 'Ko-fi',
  description:
    'Receive triggers for donations, subscriptions, commissions, and shop orders from Ko-fi.',
  auth: koFiAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ko-fi.png',
  authors: ['zeiyre'],
  categories: [PieceCategory.PAYMENT_PROCESSING],
  actions: [],
  triggers: [newDonation, newSubscription, newCommission, newShopOrder],
});
