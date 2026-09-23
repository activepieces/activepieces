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
import { shopifyAiActivateInventoryAtLocation } from './lib/actions/ai/activate-inventory-at-location';
import { shopifyAiAddProductMedia } from './lib/actions/ai/add-product-media';
import { shopifyAiAddProductsToCollection } from './lib/actions/ai/add-products-to-collection';
import { shopifyAiAddTags } from './lib/actions/ai/add-tags';
import { shopifyAiAdjustInventoryQuantities } from './lib/actions/ai/adjust-inventory-quantities';
import { shopifyAiArchiveOrder } from './lib/actions/ai/archive-order';
import { shopifyAiAttachVariantMedia } from './lib/actions/ai/attach-variant-media';
import { shopifyAiCalculateRefund } from './lib/actions/ai/calculate-refund';
import { shopifyAiCaptureOrderPayment } from './lib/actions/ai/capture-order-payment';
import { shopifyAiCompleteDraftOrder } from './lib/actions/ai/complete-draft-order';
import { shopifyAiCountAbandonedCheckouts } from './lib/actions/ai/count-abandoned-checkouts';
import { shopifyAiCountCollections } from './lib/actions/ai/count-collections';
import { shopifyAiCountCustomerSegments } from './lib/actions/ai/count-customer-segments';
import { shopifyAiCountCustomers } from './lib/actions/ai/count-customers';
import { shopifyAiCountDraftOrders } from './lib/actions/ai/count-draft-orders';
import { shopifyAiCountLocations } from './lib/actions/ai/count-locations';
import { shopifyAiCountProducts } from './lib/actions/ai/count-products';
import { shopifyAiCreateCollection } from './lib/actions/ai/create-collection';
import { shopifyAiCreateCustomerAddress } from './lib/actions/ai/create-customer-address';
import { shopifyAiCreateCustomerProfile } from './lib/actions/ai/create-customer-profile';
import { shopifyAiCreateDraftOrderWithLineItems } from './lib/actions/ai/create-draft-order-with-line-items';
import { shopifyAiCreateOrderRiskAssessment } from './lib/actions/ai/create-order-risk-assessment';
import { shopifyAiCreateOrderWithLineItems } from './lib/actions/ai/create-order-with-line-items';
import { shopifyAiCreateProductOptions } from './lib/actions/ai/create-product-options';
import { shopifyAiCreateProductRecord } from './lib/actions/ai/create-product-record';
import { shopifyAiCreateProductVariants } from './lib/actions/ai/create-product-variants';
import { shopifyAiCreateRefund } from './lib/actions/ai/create-refund';
import { shopifyAiCreateSmartCollection } from './lib/actions/ai/create-smart-collection';
import { shopifyAiDeactivateInventoryAtLocation } from './lib/actions/ai/deactivate-inventory-at-location';
import { shopifyAiDeleteCollection } from './lib/actions/ai/delete-collection';
import { shopifyAiDeleteCustomerAddress } from './lib/actions/ai/delete-customer-address';
import { shopifyAiDeleteCustomer } from './lib/actions/ai/delete-customer';
import { shopifyAiDeleteDraftOrder } from './lib/actions/ai/delete-draft-order';
import { shopifyAiDeleteOrder } from './lib/actions/ai/delete-order';
import { shopifyAiDeleteProductMedia } from './lib/actions/ai/delete-product-media';
import { shopifyAiDeleteProductOptions } from './lib/actions/ai/delete-product-options';
import { shopifyAiDeleteProductVariants } from './lib/actions/ai/delete-product-variants';
import { shopifyAiDeleteProduct } from './lib/actions/ai/delete-product';
import { shopifyAiDetachVariantMedia } from './lib/actions/ai/detach-variant-media';
import { shopifyAiDuplicateProduct } from './lib/actions/ai/duplicate-product';
import { shopifyAiGenerateCustomerActivationUrl } from './lib/actions/ai/generate-customer-activation-url';
import { shopifyAiGetAbandonment } from './lib/actions/ai/get-abandonment';
import { shopifyAiGetCheckoutAbandonment } from './lib/actions/ai/get-checkout-abandonment';
import { shopifyAiGetCollectionByHandle } from './lib/actions/ai/get-collection-by-handle';
import { shopifyAiGetCollection } from './lib/actions/ai/get-collection';
import { shopifyAiGetCustomerProfile } from './lib/actions/ai/get-customer-profile';
import { shopifyAiGetDraftOrder } from './lib/actions/ai/get-draft-order';
import { shopifyAiGetGrantedAccessScopes } from './lib/actions/ai/get-granted-access-scopes';
import { shopifyAiGetInventoryItem } from './lib/actions/ai/get-inventory-item';
import { shopifyAiGetJob } from './lib/actions/ai/get-job';
import { shopifyAiGetLocation } from './lib/actions/ai/get-location';
import { shopifyAiGetOrderRiskAssessments } from './lib/actions/ai/get-order-risk-assessments';
import { shopifyAiGetOrderTransaction } from './lib/actions/ai/get-order-transaction';
import { shopifyAiGetOrder } from './lib/actions/ai/get-order';
import { shopifyAiGetProductDetails } from './lib/actions/ai/get-product-details';
import { shopifyAiGetProductDuplicateJob } from './lib/actions/ai/get-product-duplicate-job';
import { shopifyAiGetProductMedia } from './lib/actions/ai/get-product-media';
import { shopifyAiGetProductVariantDetails } from './lib/actions/ai/get-product-variant-details';
import { shopifyAiGetPublication } from './lib/actions/ai/get-publication';
import { shopifyAiGetRefund } from './lib/actions/ai/get-refund';
import { shopifyAiGetShop } from './lib/actions/ai/get-shop';
import { shopifyAiListAbandonedCheckouts } from './lib/actions/ai/list-abandoned-checkouts';
import { shopifyAiListCollectionProducts } from './lib/actions/ai/list-collection-products';
import { shopifyAiListCustomerAddresses } from './lib/actions/ai/list-customer-addresses';
import { shopifyAiListCustomerOrders } from './lib/actions/ai/list-customer-orders';
import { shopifyAiListDraftOrders } from './lib/actions/ai/list-draft-orders';
import { shopifyAiListInventoryItems } from './lib/actions/ai/list-inventory-items';
import { shopifyAiListInventoryLevels } from './lib/actions/ai/list-inventory-levels';
import { shopifyAiListLocations } from './lib/actions/ai/list-locations';
import { shopifyAiListOrderRefunds } from './lib/actions/ai/list-order-refunds';
import { shopifyAiListOrderTransactions } from './lib/actions/ai/list-order-transactions';
import { shopifyAiListProductMedia } from './lib/actions/ai/list-product-media';
import { shopifyAiListProductVariants } from './lib/actions/ai/list-product-variants';
import { shopifyAiListPublications } from './lib/actions/ai/list-publications';
import { shopifyAiListSalesChannels } from './lib/actions/ai/list-sales-channels';
import { shopifyAiListTenderTransactions } from './lib/actions/ai/list-tender-transactions';
import { shopifyAiMarkOrderAsPaid } from './lib/actions/ai/mark-order-as-paid';
import { shopifyAiPublishResource } from './lib/actions/ai/publish-resource';
import { shopifyAiRemoveProductsFromCollection } from './lib/actions/ai/remove-products-from-collection';
import { shopifyAiRemoveTags } from './lib/actions/ai/remove-tags';
import { shopifyAiReorderCollectionProducts } from './lib/actions/ai/reorder-collection-products';
import { shopifyAiReorderProductMedia } from './lib/actions/ai/reorder-product-media';
import { shopifyAiReorderProductOptions } from './lib/actions/ai/reorder-product-options';
import { shopifyAiReorderProductVariants } from './lib/actions/ai/reorder-product-variants';
import { shopifyAiSearchCollections } from './lib/actions/ai/search-collections';
import { shopifyAiSearchCustomers } from './lib/actions/ai/search-customers';
import { shopifyAiSearchOrders } from './lib/actions/ai/search-orders';
import { shopifyAiSearchProductTaxonomy } from './lib/actions/ai/search-product-taxonomy';
import { shopifyAiSearchProducts } from './lib/actions/ai/search-products';
import { shopifyAiSendCustomerAccountInvite } from './lib/actions/ai/send-customer-account-invite';
import { shopifyAiSendDraftOrderInvoice } from './lib/actions/ai/send-draft-order-invoice';
import { shopifyAiSetDefaultCustomerAddress } from './lib/actions/ai/set-default-customer-address';
import { shopifyAiSetInventoryQuantities } from './lib/actions/ai/set-inventory-quantities';
import { shopifyAiSetProduct } from './lib/actions/ai/set-product';
import { shopifyAiStartOrderCancellation } from './lib/actions/ai/start-order-cancellation';
import { shopifyAiUnarchiveOrder } from './lib/actions/ai/unarchive-order';
import { shopifyAiUnpublishResource } from './lib/actions/ai/unpublish-resource';
import { shopifyAiUpdateCollection } from './lib/actions/ai/update-collection';
import { shopifyAiUpdateCustomerAddress } from './lib/actions/ai/update-customer-address';
import { shopifyAiUpdateCustomerProfile } from './lib/actions/ai/update-customer-profile';
import { shopifyAiUpdateDraftOrder } from './lib/actions/ai/update-draft-order';
import { shopifyAiUpdateInventoryItem } from './lib/actions/ai/update-inventory-item';
import { shopifyAiUpdateOrderDetails } from './lib/actions/ai/update-order-details';
import { shopifyAiUpdateProductFields } from './lib/actions/ai/update-product-fields';
import { shopifyAiUpdateProductMedia } from './lib/actions/ai/update-product-media';
import { shopifyAiUpdateProductOption } from './lib/actions/ai/update-product-option';
import { shopifyAiUpdateProductVariants } from './lib/actions/ai/update-product-variants';
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
    shopifyAiActivateInventoryAtLocation,
    shopifyAiAddProductMedia,
    shopifyAiAddProductsToCollection,
    shopifyAiAddTags,
    shopifyAiAdjustInventoryQuantities,
    shopifyAiArchiveOrder,
    shopifyAiAttachVariantMedia,
    shopifyAiCalculateRefund,
    shopifyAiCaptureOrderPayment,
    shopifyAiCompleteDraftOrder,
    shopifyAiCountAbandonedCheckouts,
    shopifyAiCountCollections,
    shopifyAiCountCustomerSegments,
    shopifyAiCountCustomers,
    shopifyAiCountDraftOrders,
    shopifyAiCountLocations,
    shopifyAiCountProducts,
    shopifyAiCreateCollection,
    shopifyAiCreateCustomerAddress,
    shopifyAiCreateCustomerProfile,
    shopifyAiCreateDraftOrderWithLineItems,
    shopifyAiCreateOrderRiskAssessment,
    shopifyAiCreateOrderWithLineItems,
    shopifyAiCreateProductOptions,
    shopifyAiCreateProductRecord,
    shopifyAiCreateProductVariants,
    shopifyAiCreateRefund,
    shopifyAiCreateSmartCollection,
    shopifyAiDeactivateInventoryAtLocation,
    shopifyAiDeleteCollection,
    shopifyAiDeleteCustomerAddress,
    shopifyAiDeleteCustomer,
    shopifyAiDeleteDraftOrder,
    shopifyAiDeleteOrder,
    shopifyAiDeleteProductMedia,
    shopifyAiDeleteProductOptions,
    shopifyAiDeleteProductVariants,
    shopifyAiDeleteProduct,
    shopifyAiDetachVariantMedia,
    shopifyAiDuplicateProduct,
    shopifyAiGenerateCustomerActivationUrl,
    shopifyAiGetAbandonment,
    shopifyAiGetCheckoutAbandonment,
    shopifyAiGetCollectionByHandle,
    shopifyAiGetCollection,
    shopifyAiGetCustomerProfile,
    shopifyAiGetDraftOrder,
    shopifyAiGetGrantedAccessScopes,
    shopifyAiGetInventoryItem,
    shopifyAiGetJob,
    shopifyAiGetLocation,
    shopifyAiGetOrderRiskAssessments,
    shopifyAiGetOrderTransaction,
    shopifyAiGetOrder,
    shopifyAiGetProductDetails,
    shopifyAiGetProductDuplicateJob,
    shopifyAiGetProductMedia,
    shopifyAiGetProductVariantDetails,
    shopifyAiGetPublication,
    shopifyAiGetRefund,
    shopifyAiGetShop,
    shopifyAiListAbandonedCheckouts,
    shopifyAiListCollectionProducts,
    shopifyAiListCustomerAddresses,
    shopifyAiListCustomerOrders,
    shopifyAiListDraftOrders,
    shopifyAiListInventoryItems,
    shopifyAiListInventoryLevels,
    shopifyAiListLocations,
    shopifyAiListOrderRefunds,
    shopifyAiListOrderTransactions,
    shopifyAiListProductMedia,
    shopifyAiListProductVariants,
    shopifyAiListPublications,
    shopifyAiListSalesChannels,
    shopifyAiListTenderTransactions,
    shopifyAiMarkOrderAsPaid,
    shopifyAiPublishResource,
    shopifyAiRemoveProductsFromCollection,
    shopifyAiRemoveTags,
    shopifyAiReorderCollectionProducts,
    shopifyAiReorderProductMedia,
    shopifyAiReorderProductOptions,
    shopifyAiReorderProductVariants,
    shopifyAiSearchCollections,
    shopifyAiSearchCustomers,
    shopifyAiSearchOrders,
    shopifyAiSearchProductTaxonomy,
    shopifyAiSearchProducts,
    shopifyAiSendCustomerAccountInvite,
    shopifyAiSendDraftOrderInvoice,
    shopifyAiSetDefaultCustomerAddress,
    shopifyAiSetInventoryQuantities,
    shopifyAiSetProduct,
    shopifyAiStartOrderCancellation,
    shopifyAiUnarchiveOrder,
    shopifyAiUnpublishResource,
    shopifyAiUpdateCollection,
    shopifyAiUpdateCustomerAddress,
    shopifyAiUpdateCustomerProfile,
    shopifyAiUpdateDraftOrder,
    shopifyAiUpdateInventoryItem,
    shopifyAiUpdateOrderDetails,
    shopifyAiUpdateProductFields,
    shopifyAiUpdateProductMedia,
    shopifyAiUpdateProductOption,
    shopifyAiUpdateProductVariants,
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
