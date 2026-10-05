import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
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
import { shopifyAuth, shopifyAuthHelpers } from './lib/common/auth';
import { newAbandonedCheckout } from './lib/triggers/new-abandoned-checkout';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';
import { updatedProduct } from './lib/triggers/updated-product';

export { shopifyAuth };

export const shopify = createPiece({
  displayName: 'Shopify',
  description: 'Ecommerce platform for online stores',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud","ikus060"],
  categories: [PieceCategory.COMMERCE],
  minimumSupportedRelease: '0.87.0',
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
        return auth ? shopifyAuthHelpers.getBaseUrl(auth) : '';
      },
      auth: shopifyAuth,
      authMapping: async (auth) => shopifyAuthHelpers.getAuthHeaders(auth),
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
