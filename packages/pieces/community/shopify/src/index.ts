import {
  HttpMethod,
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { AppConnectionType, PieceCategory, OAuth2GrantType } from '@activepieces/shared';
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
**Setup Instructions**:

1. Go to [Shopify Dev Dashboard](https://dev.shopify.com/) and log in
2. Create a new app or select an existing one
3. Go to **Settings** → **Credentials**
4. Under **API credentials**, copy your **Client ID** and **Client Secret**
5. Go to **Home** → **New versin**
6. Update scope (Select the following scopes 'read_orders', 'write_orders', 'write_customers', 'read_customers', 'write_products', 'read_products', 'write_draft_orders', 'read_draft_orders')
7. Redirect URLs
7. Click **Release**
**Shop Name**:
You can find your shop name in the admin URL. For example, if the URL is \`https://example.myshopify.com/admin\`, then your shop name is **example**.

**Required Scopes**:
The following scopes are automatically requested during OAuth: read_orders, write_orders, read_customers, write_customers, read_products, write_products, read_draft_orders, write_draft_orders
`;

export const shopifyAuth = PieceAuth.OAuth2({
  description: markdown,
  required: true,
  props: {
    shopName: Property.ShortText({
      displayName: 'Shop Name',
      required: true,
      description: 'The subdomain of your Shopify store (e.g., "mystore" from "mystore.myshopify.com")',
    }),
  },
  authUrl: 'https://{shopName}.myshopify.com/admin/oauth/authorize',
  tokenUrl: 'https://{shopName}.myshopify.com/admin/oauth/access_token',
  scope: ['write_orders', 'read_orders', 'write_customers', 'read_customers', 'write_products', 'read_products', 'write_draft_orders', 'read_draft_orders'],
  prompt: 'omit',
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
});

export const shopify = createPiece({
  displayName: 'Shopify',
  description: 'Ecommerce platform for online stores',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud","ikus060",'sanket-a11y'],
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
        return auth ? getBaseUrl(auth.data.shopName) : '';
      },
      auth: shopifyAuth,
      authMapping: async (auth) => {
        const typedAuth = auth.access_token;
        return {
          'X-Shopify-Access-Token': typedAuth,
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
