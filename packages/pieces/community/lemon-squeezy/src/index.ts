import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { lemonSqueezyAuth, LEMON_SQUEEZY_API_BASE } from './lib/auth';
import { listProducts } from './lib/actions/list-products';
import { listOrders } from './lib/actions/list-orders';
import { getOrder } from './lib/actions/get-order';
import { listSubscriptions } from './lib/actions/list-subscriptions';
import { createCheckout } from './lib/actions/create-checkout';
import { listCustomers } from './lib/actions/list-customers';
import { orderCreated } from './lib/triggers/order-created';

export const lemonSqueezy = createPiece({
  displayName: 'Lemon Squeezy',
  description:
    'Lemon Squeezy is the all-in-one platform for selling digital products, SaaS subscriptions, and online courses. Manage products, orders, subscriptions, and customers from your Activepieces workflows.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/lemon-squeezy.png',
  categories: [PieceCategory.PAYMENT_PROCESSING, PieceCategory.COMMERCE],
  auth: lemonSqueezyAuth,
  actions: [
    listProducts,
    listOrders,
    getOrder,
    listSubscriptions,
    createCheckout,
    listCustomers,
    createCustomApiCallAction({
      auth: lemonSqueezyAuth,
      baseUrl: () => LEMON_SQUEEZY_API_BASE,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as string}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      }),
    }),
  ],
  authors: ['Harmatta'],
  triggers: [orderCreated],
});
