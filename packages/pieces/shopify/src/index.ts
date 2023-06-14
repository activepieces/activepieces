
import { createPiece } from '@activepieces/pieces-framework';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';

export const shopify = createPiece({
  displayName: 'Shopify',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: [
    "abuaboud"
  ],
  minimumSupportedRelease: '0.3.9',
  actions: [
  ],
  triggers: [
    newCustomer,
    newOrder,
    newPaidOrder,
    newCancelledOrder
  ],
});
