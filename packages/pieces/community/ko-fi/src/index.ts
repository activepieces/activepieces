import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { koFiAuth } from './lib/auth';
import { newDonation } from './lib/triggers/new-donation';
import { newSubscription } from './lib/triggers/new-subscription';

// TODO(session-101+): add new-commission, new-shop-order triggers.
// Each clones new-donation and changes the `event.type` filter ('Commission' |
// 'Shop Order'). Single Ko-fi webhook URL fans out to all four triggers; only
// the matching `type` emits.

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
  triggers: [newDonation, newSubscription],
});
