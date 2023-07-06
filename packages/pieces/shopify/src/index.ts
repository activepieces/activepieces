
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';

export const shopifyAuth = PieceAuth.OAuth2({
  props: {
      shop: Property.ShortText({
          displayName: 'Shop Name',
          description: 'Shop Name',
          required: true
      })
  },
  displayName: 'Authentication',
  description: 'Authentication for the webhook',
  required: true,
  authUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
  tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
  scope: ['read_orders', 'read_customers']
})

export const shopify = createPiece({
  displayName: 'Shopify',

    logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: [
    "abuaboud"
  ],
  minimumSupportedRelease: '0.5.0',
  auth: shopifyAuth,
  actions: [
  ],
  triggers: [
    newCustomer,
    newOrder,
    newPaidOrder,
    newCancelledOrder
  ],
});
