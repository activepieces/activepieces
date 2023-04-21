
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';

export const shopify = createPiece({
  name: 'shopify',
  displayName: 'Shopify',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  version: packageJson.version,
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
