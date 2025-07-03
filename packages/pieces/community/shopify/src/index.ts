import {
  HttpMethod,
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { adjustInventoryLevelAction } from './lib/actions/adjust-inventory-level';
import { cancelOrderAction } from './lib/actions/cancel-order';
import { closeOrderAction } from './lib/actions/close-order';
import { createCollectAction } from './lib/actions/create-collect';
import { createCustomerAction } from './lib/actions/create-customer';
import { createDraftOrderAction } from './lib/actions/create-draft-order';
import { createFulfillmentEventAction } from './lib/actions/create-fulfillment-event';
import { createOrderAction } from './lib/actions/create-order';
import { createProductAction } from './lib/actions/create-product';
import { createTransactionAction } from './lib/actions/create-transaction';
import { getAssetAction } from './lib/actions/get-asset';
import { getCustomerAction } from './lib/actions/get-customer';
import { getCustomersAction } from './lib/actions/get-customers';
import { getCustomerOrdersAction } from './lib/actions/get-customer-orders';
import { getFulfillmentAction } from './lib/actions/get-fulfillment';
import { getFulfillmentsAction } from './lib/actions/get-fulfillments';
import { getLocationsAction } from './lib/actions/get-locations';
import { getProductAction } from './lib/actions/get-product';
import { getProductVariantAction } from './lib/actions/get-product-variant';
import { getProductsAction } from './lib/actions/get-products';
import { getTransactionAction } from './lib/actions/get-transaction';
import { getTransactionsAction } from './lib/actions/get-transactions';
import { updateCustomerAction } from './lib/actions/update-customer';
import { updateOrderAction } from './lib/actions/update-order';
import { updateProductAction } from './lib/actions/update-product';
import { uploadProductImageAction } from './lib/actions/upload-product-image';
import { getBaseUrl, sendShopifyRequest } from './lib/common';
import { newAbandonedCheckout } from './lib/triggers/new-abandoned-checkout';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';
import { updatedProduct } from './lib/triggers/updated-product';

const markdown = `
**Shop Name**:

You can find your shop name in the url For example, if the URL is \`https://example.myshopify.com/admin\`, then your shop name is **example**.

**Admin Token**:

1. Login to your Shopify account
2. Go to Settings -> Apps
3. Click on Develop apps
4. Create an App
5. Fill the app name
6. Click on Configure Admin API Scopes (Select the following scopes 'read_orders', 'write_orders', 'write_customers', 'read_customers', 'write_products', 'read_products', 'write_draft_orders', 'read_draft_orders')
7. Click on Install app
8. Copy the Admin Access Token
`;

export const shopifyAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    shopName: Property.ShortText({
      displayName: 'Shop Name',
      required: true,
    }),
    adminToken: PieceAuth.SecretText({
      displayName: 'Admin Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await sendShopifyRequest({
        auth,
        method: HttpMethod.GET,
        url: '/shop.json',
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Shop Name or Admin Token',
      };
    }
  },
});

export const shopify = createPiece({
  displayName: 'Shopify',
  description: 'Ecommerce platform for online stores',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud","ikus060"],
  categories: [PieceCategory.COMMERCE],
  minimumSupportedRelease: '0.30.0',
  auth: shopifyAuth,
  actions: [
    adjustInventoryLevelAction,
    cancelOrderAction,
    closeOrderAction,
    createCollectAction,
    createCustomerAction,
    createDraftOrderAction,
    createFulfillmentEventAction,
    createOrderAction,
    createProductAction,
    createTransactionAction,
    getAssetAction,
    getCustomerAction,
    getCustomersAction,
    getCustomerOrdersAction,
    getFulfillmentAction,
    getFulfillmentsAction,
    getLocationsAction,
    getProductAction,
    getProductVariantAction,
    getProductsAction,
    getTransactionAction,
    getTransactionsAction,
    updateCustomerAction,
    updateOrderAction,
    updateProductAction,
    uploadProductImageAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return getBaseUrl((auth as { shopName: string }).shopName);
      },
      auth: shopifyAuth,
      authMapping: async (auth) => {
        const typedAuth = auth as { adminToken: string };
        return {
          'X-Shopify-Access-Token': typedAuth.adminToken,
        };
      },
    }),
  ],
  triggers: [
    newAbandonedCheckout,
    newCancelledOrder,
    newCustomer,
    newOrder,
    updatedProduct,
    newPaidOrder,
  ],
});
