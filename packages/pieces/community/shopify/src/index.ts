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
import { shopifyAiAddTags } from './lib/actions/ai/add-tags';
import { shopifyAiArchiveOrder } from './lib/actions/ai/archive-order';
import { shopifyAiCalculateRefund } from './lib/actions/ai/calculate-refund';
import { shopifyAiCaptureOrderPayment } from './lib/actions/ai/capture-order-payment';
import { shopifyAiCompleteDraftOrder } from './lib/actions/ai/complete-draft-order';
import { shopifyAiCountAbandonedCheckouts } from './lib/actions/ai/count-abandoned-checkouts';
import { shopifyAiCountCustomerSegments } from './lib/actions/ai/count-customer-segments';
import { shopifyAiCountCustomers } from './lib/actions/ai/count-customers';
import { shopifyAiCountDraftOrders } from './lib/actions/ai/count-draft-orders';
import { shopifyAiCreateCustomerAddress } from './lib/actions/ai/create-customer-address';
import { shopifyAiCreateCustomerProfile } from './lib/actions/ai/create-customer-profile';
import { shopifyAiCreateDraftOrderWithLineItems } from './lib/actions/ai/create-draft-order-with-line-items';
import { shopifyAiCreateOrderRiskAssessment } from './lib/actions/ai/create-order-risk-assessment';
import { shopifyAiCreateOrderWithLineItems } from './lib/actions/ai/create-order-with-line-items';
import { shopifyAiCreateRefund } from './lib/actions/ai/create-refund';
import { shopifyAiDeleteCustomerAddress } from './lib/actions/ai/delete-customer-address';
import { shopifyAiDeleteCustomer } from './lib/actions/ai/delete-customer';
import { shopifyAiDeleteDraftOrder } from './lib/actions/ai/delete-draft-order';
import { shopifyAiDeleteOrder } from './lib/actions/ai/delete-order';
import { shopifyAiGenerateCustomerActivationUrl } from './lib/actions/ai/generate-customer-activation-url';
import { shopifyAiGetAbandonment } from './lib/actions/ai/get-abandonment';
import { shopifyAiGetCheckoutAbandonment } from './lib/actions/ai/get-checkout-abandonment';
import { shopifyAiGetCustomerProfile } from './lib/actions/ai/get-customer-profile';
import { shopifyAiGetDraftOrder } from './lib/actions/ai/get-draft-order';
import { shopifyAiGetGrantedAccessScopes } from './lib/actions/ai/get-granted-access-scopes';
import { shopifyAiGetJob } from './lib/actions/ai/get-job';
import { shopifyAiGetOrderRiskAssessments } from './lib/actions/ai/get-order-risk-assessments';
import { shopifyAiGetOrderTransaction } from './lib/actions/ai/get-order-transaction';
import { shopifyAiGetOrder } from './lib/actions/ai/get-order';
import { shopifyAiGetRefund } from './lib/actions/ai/get-refund';
import { shopifyAiGetShop } from './lib/actions/ai/get-shop';
import { shopifyAiListAbandonedCheckouts } from './lib/actions/ai/list-abandoned-checkouts';
import { shopifyAiListCustomerAddresses } from './lib/actions/ai/list-customer-addresses';
import { shopifyAiListCustomerOrders } from './lib/actions/ai/list-customer-orders';
import { shopifyAiListDraftOrders } from './lib/actions/ai/list-draft-orders';
import { shopifyAiListOrderRefunds } from './lib/actions/ai/list-order-refunds';
import { shopifyAiListOrderTransactions } from './lib/actions/ai/list-order-transactions';
import { shopifyAiListTenderTransactions } from './lib/actions/ai/list-tender-transactions';
import { shopifyAiMarkOrderAsPaid } from './lib/actions/ai/mark-order-as-paid';
import { shopifyAiRemoveTags } from './lib/actions/ai/remove-tags';
import { shopifyAiSearchCustomers } from './lib/actions/ai/search-customers';
import { shopifyAiSearchOrders } from './lib/actions/ai/search-orders';
import { shopifyAiSendCustomerAccountInvite } from './lib/actions/ai/send-customer-account-invite';
import { shopifyAiSendDraftOrderInvoice } from './lib/actions/ai/send-draft-order-invoice';
import { shopifyAiSetDefaultCustomerAddress } from './lib/actions/ai/set-default-customer-address';
import { shopifyAiStartOrderCancellation } from './lib/actions/ai/start-order-cancellation';
import { shopifyAiUnarchiveOrder } from './lib/actions/ai/unarchive-order';
import { shopifyAiUpdateCustomerAddress } from './lib/actions/ai/update-customer-address';
import { shopifyAiUpdateCustomerProfile } from './lib/actions/ai/update-customer-profile';
import { shopifyAiUpdateDraftOrder } from './lib/actions/ai/update-draft-order';
import { shopifyAiUpdateOrderDetails } from './lib/actions/ai/update-order-details';
import { shopifyAiVoidOrderTransaction } from './lib/actions/ai/void-order-transaction';
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
  minimumSupportedRelease: '0.88.2',
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
    shopifyAiAddTags,
    shopifyAiArchiveOrder,
    shopifyAiCalculateRefund,
    shopifyAiCaptureOrderPayment,
    shopifyAiCompleteDraftOrder,
    shopifyAiCountAbandonedCheckouts,
    shopifyAiCountCustomerSegments,
    shopifyAiCountCustomers,
    shopifyAiCountDraftOrders,
    shopifyAiCreateCustomerAddress,
    shopifyAiCreateCustomerProfile,
    shopifyAiCreateDraftOrderWithLineItems,
    shopifyAiCreateOrderRiskAssessment,
    shopifyAiCreateOrderWithLineItems,
    shopifyAiCreateRefund,
    shopifyAiDeleteCustomerAddress,
    shopifyAiDeleteCustomer,
    shopifyAiDeleteDraftOrder,
    shopifyAiDeleteOrder,
    shopifyAiGenerateCustomerActivationUrl,
    shopifyAiGetAbandonment,
    shopifyAiGetCheckoutAbandonment,
    shopifyAiGetCustomerProfile,
    shopifyAiGetDraftOrder,
    shopifyAiGetGrantedAccessScopes,
    shopifyAiGetJob,
    shopifyAiGetOrderRiskAssessments,
    shopifyAiGetOrderTransaction,
    shopifyAiGetOrder,
    shopifyAiGetRefund,
    shopifyAiGetShop,
    shopifyAiListAbandonedCheckouts,
    shopifyAiListCustomerAddresses,
    shopifyAiListCustomerOrders,
    shopifyAiListDraftOrders,
    shopifyAiListOrderRefunds,
    shopifyAiListOrderTransactions,
    shopifyAiListTenderTransactions,
    shopifyAiMarkOrderAsPaid,
    shopifyAiRemoveTags,
    shopifyAiSearchCustomers,
    shopifyAiSearchOrders,
    shopifyAiSendCustomerAccountInvite,
    shopifyAiSendDraftOrderInvoice,
    shopifyAiSetDefaultCustomerAddress,
    shopifyAiStartOrderCancellation,
    shopifyAiUnarchiveOrder,
    shopifyAiUpdateCustomerAddress,
    shopifyAiUpdateCustomerProfile,
    shopifyAiUpdateDraftOrder,
    shopifyAiUpdateOrderDetails,
    shopifyAiVoidOrderTransaction,
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
