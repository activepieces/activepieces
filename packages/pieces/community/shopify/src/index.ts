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
import { shopifyAiAddDiscountRedeemCodes } from './lib/actions/ai/add-discount-redeem-codes';
import { shopifyAiAddProductMedia } from './lib/actions/ai/add-product-media';
import { shopifyAiAddProductsToCollection } from './lib/actions/ai/add-products-to-collection';
import { shopifyAiAddTags } from './lib/actions/ai/add-tags';
import { shopifyAiListDeliveryZones } from './lib/actions/ai/list-delivery-zones';
import { shopifyAiDeleteAnalyticsAnnotation } from './lib/actions/ai/delete-analytics-annotation';
import { shopifyAiUpdateAnalyticsAnnotation } from './lib/actions/ai/update-analytics-annotation';
import { shopifyAiCreateAnalyticsAnnotation } from './lib/actions/ai/create-analytics-annotation';
import { shopifyAiDeleteAnalyticsTargets } from './lib/actions/ai/delete-analytics-targets';
import { shopifyAiUpdateAnalyticsTarget } from './lib/actions/ai/update-analytics-target';
import { shopifyAiCreateAnalyticsTarget } from './lib/actions/ai/create-analytics-target';
import { shopifyAiListAnalyticsTargets } from './lib/actions/ai/list-analytics-targets';
import { shopifyAiGetReturnPolicyProfile } from './lib/actions/ai/get-return-policy-profile';
import { shopifyAiListReturnPolicyProfiles } from './lib/actions/ai/list-return-policy-profiles';
import { shopifyAiListMarketRelationships } from './lib/actions/ai/list-market-relationships';
import { shopifyAiGetMarket } from './lib/actions/ai/get-market';
import { shopifyAiListMarkets } from './lib/actions/ai/list-markets';
import { shopifyAiSendPaymentMethodUpdateEmail } from './lib/actions/ai/send-payment-method-update-email';
import { shopifyAiResolveRequestedOrderEdit } from './lib/actions/ai/resolve-requested-order-edit';
import { shopifyAiDeclineRequestedOrderEdit } from './lib/actions/ai/decline-requested-order-edit';
import { shopifyAiCreateRequestedOrderEdit } from './lib/actions/ai/create-requested-order-edit';
import { shopifyAiCalculateRequestedOrderEdit } from './lib/actions/ai/calculate-requested-order-edit';
import { shopifyAiListRequestedOrderEdits } from './lib/actions/ai/list-requested-order-edits';
import { shopifyAiAdjustInventoryQuantities } from './lib/actions/ai/adjust-inventory-quantities';
import { shopifyAiApproveComment } from './lib/actions/ai/approve-comment';
import { shopifyAiArchiveOrder } from './lib/actions/ai/archive-order';
import { shopifyAiAttachVariantMedia } from './lib/actions/ai/attach-variant-media';
import { shopifyAiBulkDeleteMetaobjects } from './lib/actions/ai/bulk-delete-metaobjects';
import { shopifyAiCalculateRefund } from './lib/actions/ai/calculate-refund';
import { shopifyAiCancelBulkOperation } from './lib/actions/ai/cancel-bulk-operation';
import { shopifyAiCancelFulfillmentOrder } from './lib/actions/ai/cancel-fulfillment-order';
import { shopifyAiCancelFulfillment } from './lib/actions/ai/cancel-fulfillment';
import { shopifyAiCaptureOrderPayment } from './lib/actions/ai/capture-order-payment';
import { shopifyAiCompleteDraftOrder } from './lib/actions/ai/complete-draft-order';
import { shopifyAiCountAbandonedCheckouts } from './lib/actions/ai/count-abandoned-checkouts';
import { shopifyAiCountBlogs } from './lib/actions/ai/count-blogs';
import { shopifyAiCountCatalogs } from './lib/actions/ai/count-catalogs';
import { shopifyAiCountCollections } from './lib/actions/ai/count-collections';
import { shopifyAiCountCustomerSegments } from './lib/actions/ai/count-customer-segments';
import { shopifyAiCountCustomers } from './lib/actions/ai/count-customers';
import { shopifyAiCountDiscountCodes } from './lib/actions/ai/count-discount-codes';
import { shopifyAiCountDiscounts } from './lib/actions/ai/count-discounts';
import { shopifyAiCountDraftOrders } from './lib/actions/ai/count-draft-orders';
import { shopifyAiCountEvents } from './lib/actions/ai/count-events';
import { shopifyAiCountGiftCards } from './lib/actions/ai/count-gift-cards';
import { shopifyAiCountLocations } from './lib/actions/ai/count-locations';
import { shopifyAiCountPages } from './lib/actions/ai/count-pages';
import { shopifyAiCountProducts } from './lib/actions/ai/count-products';
import { shopifyAiCountUrlRedirects } from './lib/actions/ai/count-url-redirects';
import { shopifyAiCreateArticle } from './lib/actions/ai/create-article';
import { shopifyAiCreateBasicDiscountCode } from './lib/actions/ai/create-basic-discount-code';
import { shopifyAiCreateBlog } from './lib/actions/ai/create-blog';
import { shopifyAiCreateBxgyDiscountCode } from './lib/actions/ai/create-bxgy-discount-code';
import { shopifyAiCreateCollection } from './lib/actions/ai/create-collection';
import { shopifyAiCreateCustomerAddress } from './lib/actions/ai/create-customer-address';
import { shopifyAiCreateCustomerProfile } from './lib/actions/ai/create-customer-profile';
import { shopifyAiCreateDraftOrderWithLineItems } from './lib/actions/ai/create-draft-order-with-line-items';
import { shopifyAiCreateFreeShippingDiscountCode } from './lib/actions/ai/create-free-shipping-discount-code';
import { shopifyAiCreateFulfillmentTrackingEvent } from './lib/actions/ai/create-fulfillment-tracking-event';
import { shopifyAiCreateFulfillment } from './lib/actions/ai/create-fulfillment';
import { shopifyAiCreateGiftCard } from './lib/actions/ai/create-gift-card';
import { shopifyAiCreateMarketingEngagement } from './lib/actions/ai/create-marketing-engagement';
import { shopifyAiCreateOrderRiskAssessment } from './lib/actions/ai/create-order-risk-assessment';
import { shopifyAiCreateOrderWithLineItems } from './lib/actions/ai/create-order-with-line-items';
import { shopifyAiCreatePage } from './lib/actions/ai/create-page';
import { shopifyAiCreateProductOptions } from './lib/actions/ai/create-product-options';
import { shopifyAiCreateProductRecord } from './lib/actions/ai/create-product-record';
import { shopifyAiCreateProductVariants } from './lib/actions/ai/create-product-variants';
import { shopifyAiCreateRefund } from './lib/actions/ai/create-refund';
import { shopifyAiCreateScriptTag } from './lib/actions/ai/create-script-tag';
import { shopifyAiCreateSmartCollection } from './lib/actions/ai/create-smart-collection';
import { shopifyAiCreateTheme } from './lib/actions/ai/create-theme';
import { shopifyAiCreateUrlRedirect } from './lib/actions/ai/create-url-redirect';
import { shopifyAiDeactivateGiftCard } from './lib/actions/ai/deactivate-gift-card';
import { shopifyAiDeactivateInventoryAtLocation } from './lib/actions/ai/deactivate-inventory-at-location';
import { shopifyAiDeleteArticle } from './lib/actions/ai/delete-article';
import { shopifyAiDeleteBlog } from './lib/actions/ai/delete-blog';
import { shopifyAiDeleteCollection } from './lib/actions/ai/delete-collection';
import { shopifyAiDeleteComment } from './lib/actions/ai/delete-comment';
import { shopifyAiDeleteCustomerAddress } from './lib/actions/ai/delete-customer-address';
import { shopifyAiDeleteCustomer } from './lib/actions/ai/delete-customer';
import { shopifyAiDeleteDiscountRedeemCodes } from './lib/actions/ai/delete-discount-redeem-codes';
import { shopifyAiDeleteDiscount } from './lib/actions/ai/delete-discount';
import { shopifyAiDeleteDraftOrder } from './lib/actions/ai/delete-draft-order';
import { shopifyAiDeleteExternalMarketingActivity } from './lib/actions/ai/delete-external-marketing-activity';
import { shopifyAiDeleteFulfillmentService } from './lib/actions/ai/delete-fulfillment-service';
import { shopifyAiDeleteMetafields } from './lib/actions/ai/delete-metafields';
import { shopifyAiDeleteMetaobjectDefinition } from './lib/actions/ai/delete-metaobject-definition';
import { shopifyAiDeleteMetaobject } from './lib/actions/ai/delete-metaobject';
import { shopifyAiDeleteOrder } from './lib/actions/ai/delete-order';
import { shopifyAiDeletePage } from './lib/actions/ai/delete-page';
import { shopifyAiDeleteProductMedia } from './lib/actions/ai/delete-product-media';
import { shopifyAiDeleteProductOptions } from './lib/actions/ai/delete-product-options';
import { shopifyAiDeleteProductVariants } from './lib/actions/ai/delete-product-variants';
import { shopifyAiDeleteProduct } from './lib/actions/ai/delete-product';
import { shopifyAiDeleteSavedSearch } from './lib/actions/ai/delete-saved-search';
import { shopifyAiDeleteScriptTag } from './lib/actions/ai/delete-script-tag';
import { shopifyAiDeleteThemeFiles } from './lib/actions/ai/delete-theme-files';
import { shopifyAiDeleteTheme } from './lib/actions/ai/delete-theme';
import { shopifyAiDeleteUrlRedirect } from './lib/actions/ai/delete-url-redirect';
import { shopifyAiDeleteWebPresence } from './lib/actions/ai/delete-web-presence';
import { shopifyAiDetachVariantMedia } from './lib/actions/ai/detach-variant-media';
import { shopifyAiDuplicateProduct } from './lib/actions/ai/duplicate-product';
import { shopifyAiEnableStandardMetaobjectDefinition } from './lib/actions/ai/enable-standard-metaobject-definition';
import { shopifyAiFindDiscountByCode } from './lib/actions/ai/find-discount-by-code';
import { shopifyAiGenerateCustomerActivationUrl } from './lib/actions/ai/generate-customer-activation-url';
import { shopifyAiGetAbandonment } from './lib/actions/ai/get-abandonment';
import { shopifyAiGetArticle } from './lib/actions/ai/get-article';
import { shopifyAiGetBlog } from './lib/actions/ai/get-blog';
import { shopifyAiGetBulkOperation } from './lib/actions/ai/get-bulk-operation';
import { shopifyAiGetBusinessEntity } from './lib/actions/ai/get-business-entity';
import { shopifyAiGetCheckoutAbandonment } from './lib/actions/ai/get-checkout-abandonment';
import { shopifyAiGetCollectionByHandle } from './lib/actions/ai/get-collection-by-handle';
import { shopifyAiGetCollection } from './lib/actions/ai/get-collection';
import { shopifyAiGetCustomerProfile } from './lib/actions/ai/get-customer-profile';
import { shopifyAiGetDiscountRedeemCodeBulkCreation } from './lib/actions/ai/get-discount-redeem-code-bulk-creation';
import { shopifyAiGetDiscount } from './lib/actions/ai/get-discount';
import { shopifyAiGetDomain } from './lib/actions/ai/get-domain';
import { shopifyAiGetDraftOrder } from './lib/actions/ai/get-draft-order';
import { shopifyAiGetEvent } from './lib/actions/ai/get-event';
import { shopifyAiGetFulfillmentDetails } from './lib/actions/ai/get-fulfillment-details';
import { shopifyAiGetFulfillmentOrder } from './lib/actions/ai/get-fulfillment-order';
import { shopifyAiGetGiftCard } from './lib/actions/ai/get-gift-card';
import { shopifyAiGetGrantedAccessScopes } from './lib/actions/ai/get-granted-access-scopes';
import { shopifyAiGetInventoryItem } from './lib/actions/ai/get-inventory-item';
import { shopifyAiGetJob } from './lib/actions/ai/get-job';
import { shopifyAiGetLocation } from './lib/actions/ai/get-location';
import { shopifyAiGetMarketingEvent } from './lib/actions/ai/get-marketing-event';
import { shopifyAiGetMetafieldDefinition } from './lib/actions/ai/get-metafield-definition';
import { shopifyAiGetMetafield } from './lib/actions/ai/get-metafield';
import { shopifyAiGetMetaobject } from './lib/actions/ai/get-metaobject';
import { shopifyAiGetOnlineStoreSettings } from './lib/actions/ai/get-online-store-settings';
import { shopifyAiGetOrderRiskAssessments } from './lib/actions/ai/get-order-risk-assessments';
import { shopifyAiGetOrderTransaction } from './lib/actions/ai/get-order-transaction';
import { shopifyAiGetOrder } from './lib/actions/ai/get-order';
import { shopifyAiGetPage } from './lib/actions/ai/get-page';
import { shopifyAiGetProductDetails } from './lib/actions/ai/get-product-details';
import { shopifyAiGetProductDuplicateJob } from './lib/actions/ai/get-product-duplicate-job';
import { shopifyAiGetProductMedia } from './lib/actions/ai/get-product-media';
import { shopifyAiGetProductVariantDetails } from './lib/actions/ai/get-product-variant-details';
import { shopifyAiGetPublication } from './lib/actions/ai/get-publication';
import { shopifyAiGetRefund } from './lib/actions/ai/get-refund';
import { shopifyAiGetScriptTag } from './lib/actions/ai/get-script-tag';
import { shopifyAiGetShopBillingPreferences } from './lib/actions/ai/get-shop-billing-preferences';
import { shopifyAiGetShop } from './lib/actions/ai/get-shop';
import { shopifyAiGetThemeFile } from './lib/actions/ai/get-theme-file';
import { shopifyAiGetTheme } from './lib/actions/ai/get-theme';
import { shopifyAiGetUrlRedirect } from './lib/actions/ai/get-url-redirect';
import { shopifyAiHoldFulfillmentOrder } from './lib/actions/ai/hold-fulfillment-order';
import { shopifyAiListAbandonedCheckouts } from './lib/actions/ai/list-abandoned-checkouts';
import { shopifyAiListArticleAuthors } from './lib/actions/ai/list-article-authors';
import { shopifyAiListArticleTags } from './lib/actions/ai/list-article-tags';
import { shopifyAiListArticles } from './lib/actions/ai/list-articles';
import { shopifyAiListAvailableLocales } from './lib/actions/ai/list-available-locales';
import { shopifyAiListBlogs } from './lib/actions/ai/list-blogs';
import { shopifyAiListBulkOperations } from './lib/actions/ai/list-bulk-operations';
import { shopifyAiListBusinessEntities } from './lib/actions/ai/list-business-entities';
import { shopifyAiListCarrierServices } from './lib/actions/ai/list-carrier-services';
import { shopifyAiListCatalogs } from './lib/actions/ai/list-catalogs';
import { shopifyAiListCollectionProducts } from './lib/actions/ai/list-collection-products';
import { shopifyAiListComments } from './lib/actions/ai/list-comments';
import { shopifyAiListConsentPolicies } from './lib/actions/ai/list-consent-policies';
import { shopifyAiListConsentPolicyRegions } from './lib/actions/ai/list-consent-policy-regions';
import { shopifyAiListCustomerAccountPages } from './lib/actions/ai/list-customer-account-pages';
import { shopifyAiListCustomerAddresses } from './lib/actions/ai/list-customer-addresses';
import { shopifyAiListCustomerOrders } from './lib/actions/ai/list-customer-orders';
import { shopifyAiListDeliveryProfiles } from './lib/actions/ai/list-delivery-profiles';
import { shopifyAiListDiscountRedeemCodes } from './lib/actions/ai/list-discount-redeem-codes';
import { shopifyAiListDiscounts } from './lib/actions/ai/list-discounts';
import { shopifyAiListDraftOrders } from './lib/actions/ai/list-draft-orders';
import { shopifyAiListEnabledCurrencies } from './lib/actions/ai/list-enabled-currencies';
import { shopifyAiListEvents } from './lib/actions/ai/list-events';
import { shopifyAiListFulfillmentEvents } from './lib/actions/ai/list-fulfillment-events';
import { shopifyAiListFulfillmentOrderMoveLocations } from './lib/actions/ai/list-fulfillment-order-move-locations';
import { shopifyAiListFulfillmentServices } from './lib/actions/ai/list-fulfillment-services';
import { shopifyAiListInventoryItems } from './lib/actions/ai/list-inventory-items';
import { shopifyAiListInventoryLevels } from './lib/actions/ai/list-inventory-levels';
import { shopifyAiListLocations } from './lib/actions/ai/list-locations';
import { shopifyAiListMarketingEvents } from './lib/actions/ai/list-marketing-events';
import { shopifyAiListMetafieldDefinitionTypes } from './lib/actions/ai/list-metafield-definition-types';
import { shopifyAiListMetafieldDefinitions } from './lib/actions/ai/list-metafield-definitions';
import { shopifyAiListMetafields } from './lib/actions/ai/list-metafields';
import { shopifyAiListMetaobjectDefinitions } from './lib/actions/ai/list-metaobject-definitions';
import { shopifyAiListMetaobjects } from './lib/actions/ai/list-metaobjects';
import { shopifyAiListOrderFulfillmentOrders } from './lib/actions/ai/list-order-fulfillment-orders';
import { shopifyAiListOrderFulfillments } from './lib/actions/ai/list-order-fulfillments';
import { shopifyAiListOrderRefunds } from './lib/actions/ai/list-order-refunds';
import { shopifyAiListOrderTransactions } from './lib/actions/ai/list-order-transactions';
import { shopifyAiListPages } from './lib/actions/ai/list-pages';
import { shopifyAiListPaymentDisputes } from './lib/actions/ai/list-payment-disputes';
import { shopifyAiListPaymentTermsTemplates } from './lib/actions/ai/list-payment-terms-templates';
import { shopifyAiListProductMedia } from './lib/actions/ai/list-product-media';
import { shopifyAiListProductVariants } from './lib/actions/ai/list-product-variants';
import { shopifyAiListPublications } from './lib/actions/ai/list-publications';
import { shopifyAiListSalesChannels } from './lib/actions/ai/list-sales-channels';
import { shopifyAiListSavedSearches } from './lib/actions/ai/list-saved-searches';
import { shopifyAiListScriptTags } from './lib/actions/ai/list-script-tags';
import { shopifyAiListShopPayPaymentRequestReceipts } from './lib/actions/ai/list-shop-pay-payment-request-receipts';
import { shopifyAiListShopPolicies } from './lib/actions/ai/list-shop-policies';
import { shopifyAiListStandardMetafieldDefinitionTemplates } from './lib/actions/ai/list-standard-metafield-definition-templates';
import { shopifyAiListTenderTransactions } from './lib/actions/ai/list-tender-transactions';
import { shopifyAiListThemeFiles } from './lib/actions/ai/list-theme-files';
import { shopifyAiListThemes } from './lib/actions/ai/list-themes';
import { shopifyAiListUrlRedirects } from './lib/actions/ai/list-url-redirects';
import { shopifyAiListWebPresences } from './lib/actions/ai/list-web-presences';
import { shopifyAiMarkCommentNotSpam } from './lib/actions/ai/mark-comment-not-spam';
import { shopifyAiMarkCommentSpam } from './lib/actions/ai/mark-comment-spam';
import { shopifyAiMarkOrderAsPaid } from './lib/actions/ai/mark-order-as-paid';
import { shopifyAiMoveFulfillmentOrder } from './lib/actions/ai/move-fulfillment-order';
import { shopifyAiPinMetafieldDefinition } from './lib/actions/ai/pin-metafield-definition';
import { shopifyAiPublishResource } from './lib/actions/ai/publish-resource';
import { shopifyAiPublishTheme } from './lib/actions/ai/publish-theme';
import { shopifyAiReleaseFulfillmentOrderHold } from './lib/actions/ai/release-fulfillment-order-hold';
import { shopifyAiRemoveProductsFromCollection } from './lib/actions/ai/remove-products-from-collection';
import { shopifyAiRemoveTags } from './lib/actions/ai/remove-tags';
import { shopifyAiReorderCollectionProducts } from './lib/actions/ai/reorder-collection-products';
import { shopifyAiReorderProductMedia } from './lib/actions/ai/reorder-product-media';
import { shopifyAiReorderProductOptions } from './lib/actions/ai/reorder-product-options';
import { shopifyAiReorderProductVariants } from './lib/actions/ai/reorder-product-variants';
import { shopifyAiSearchCollections } from './lib/actions/ai/search-collections';
import { shopifyAiSearchCustomers } from './lib/actions/ai/search-customers';
import { shopifyAiSearchGiftCards } from './lib/actions/ai/search-gift-cards';
import { shopifyAiSearchOrders } from './lib/actions/ai/search-orders';
import { shopifyAiSearchProductTaxonomy } from './lib/actions/ai/search-product-taxonomy';
import { shopifyAiSearchProducts } from './lib/actions/ai/search-products';
import { shopifyAiSendCustomerAccountInvite } from './lib/actions/ai/send-customer-account-invite';
import { shopifyAiSendDraftOrderInvoice } from './lib/actions/ai/send-draft-order-invoice';
import { shopifyAiSetDefaultCustomerAddress } from './lib/actions/ai/set-default-customer-address';
import { shopifyAiSetFulfillmentOrdersDeadline } from './lib/actions/ai/set-fulfillment-orders-deadline';
import { shopifyAiSetInventoryQuantities } from './lib/actions/ai/set-inventory-quantities';
import { shopifyAiSetMetafields } from './lib/actions/ai/set-metafields';
import { shopifyAiSetProduct } from './lib/actions/ai/set-product';
import { shopifyAiStartBulkMutation } from './lib/actions/ai/start-bulk-mutation';
import { shopifyAiStartBulkQuery } from './lib/actions/ai/start-bulk-query';
import { shopifyAiStartOrderCancellation } from './lib/actions/ai/start-order-cancellation';
import { shopifyAiUnarchiveOrder } from './lib/actions/ai/unarchive-order';
import { shopifyAiUnpublishResource } from './lib/actions/ai/unpublish-resource';
import { shopifyAiUpdateArticle } from './lib/actions/ai/update-article';
import { shopifyAiUpdateBasicDiscountCode } from './lib/actions/ai/update-basic-discount-code';
import { shopifyAiUpdateBlog } from './lib/actions/ai/update-blog';
import { shopifyAiUpdateCollection } from './lib/actions/ai/update-collection';
import { shopifyAiUpdateCustomerAddress } from './lib/actions/ai/update-customer-address';
import { shopifyAiUpdateCustomerProfile } from './lib/actions/ai/update-customer-profile';
import { shopifyAiUpdateDraftOrder } from './lib/actions/ai/update-draft-order';
import { shopifyAiUpdateExternalMarketingActivity } from './lib/actions/ai/update-external-marketing-activity';
import { shopifyAiUpdateFreeShippingDiscountCode } from './lib/actions/ai/update-free-shipping-discount-code';
import { shopifyAiUpdateFulfillmentTracking } from './lib/actions/ai/update-fulfillment-tracking';
import { shopifyAiUpdateGiftCard } from './lib/actions/ai/update-gift-card';
import { shopifyAiUpdateInventoryItem } from './lib/actions/ai/update-inventory-item';
import { shopifyAiUpdateMetafieldDefinition } from './lib/actions/ai/update-metafield-definition';
import { shopifyAiUpdateOrderDetails } from './lib/actions/ai/update-order-details';
import { shopifyAiUpdatePage } from './lib/actions/ai/update-page';
import { shopifyAiUpdateProductFields } from './lib/actions/ai/update-product-fields';
import { shopifyAiUpdateProductMedia } from './lib/actions/ai/update-product-media';
import { shopifyAiUpdateProductOption } from './lib/actions/ai/update-product-option';
import { shopifyAiUpdateProductVariants } from './lib/actions/ai/update-product-variants';
import { shopifyAiUpdateScriptTag } from './lib/actions/ai/update-script-tag';
import { shopifyAiUpdateTheme } from './lib/actions/ai/update-theme';
import { shopifyAiUpdateUrlRedirect } from './lib/actions/ai/update-url-redirect';
import { shopifyAiUpsertExternalMarketingActivity } from './lib/actions/ai/upsert-external-marketing-activity';
import { shopifyAiUpsertMetaobject } from './lib/actions/ai/upsert-metaobject';
import { shopifyAiUpsertThemeFiles } from './lib/actions/ai/upsert-theme-files';
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
    shopifyAiAddDiscountRedeemCodes,
    shopifyAiAddProductMedia,
    shopifyAiAddProductsToCollection,
    shopifyAiAddTags,
    shopifyAiListDeliveryZones,
    shopifyAiDeleteAnalyticsAnnotation,
    shopifyAiUpdateAnalyticsAnnotation,
    shopifyAiCreateAnalyticsAnnotation,
    shopifyAiDeleteAnalyticsTargets,
    shopifyAiUpdateAnalyticsTarget,
    shopifyAiCreateAnalyticsTarget,
    shopifyAiListAnalyticsTargets,
    shopifyAiGetReturnPolicyProfile,
    shopifyAiListReturnPolicyProfiles,
    shopifyAiListMarketRelationships,
    shopifyAiGetMarket,
    shopifyAiListMarkets,
    shopifyAiSendPaymentMethodUpdateEmail,
    shopifyAiResolveRequestedOrderEdit,
    shopifyAiDeclineRequestedOrderEdit,
    shopifyAiCreateRequestedOrderEdit,
    shopifyAiCalculateRequestedOrderEdit,
    shopifyAiListRequestedOrderEdits,
    shopifyAiAdjustInventoryQuantities,
    shopifyAiApproveComment,
    shopifyAiArchiveOrder,
    shopifyAiAttachVariantMedia,
    shopifyAiBulkDeleteMetaobjects,
    shopifyAiCalculateRefund,
    shopifyAiCancelBulkOperation,
    shopifyAiCancelFulfillmentOrder,
    shopifyAiCancelFulfillment,
    shopifyAiCaptureOrderPayment,
    shopifyAiCompleteDraftOrder,
    shopifyAiCountAbandonedCheckouts,
    shopifyAiCountBlogs,
    shopifyAiCountCatalogs,
    shopifyAiCountCollections,
    shopifyAiCountCustomerSegments,
    shopifyAiCountCustomers,
    shopifyAiCountDiscountCodes,
    shopifyAiCountDiscounts,
    shopifyAiCountDraftOrders,
    shopifyAiCountEvents,
    shopifyAiCountGiftCards,
    shopifyAiCountLocations,
    shopifyAiCountPages,
    shopifyAiCountProducts,
    shopifyAiCountUrlRedirects,
    shopifyAiCreateArticle,
    shopifyAiCreateBasicDiscountCode,
    shopifyAiCreateBlog,
    shopifyAiCreateBxgyDiscountCode,
    shopifyAiCreateCollection,
    shopifyAiCreateCustomerAddress,
    shopifyAiCreateCustomerProfile,
    shopifyAiCreateDraftOrderWithLineItems,
    shopifyAiCreateFreeShippingDiscountCode,
    shopifyAiCreateFulfillmentTrackingEvent,
    shopifyAiCreateFulfillment,
    shopifyAiCreateGiftCard,
    shopifyAiCreateMarketingEngagement,
    shopifyAiCreateOrderRiskAssessment,
    shopifyAiCreateOrderWithLineItems,
    shopifyAiCreatePage,
    shopifyAiCreateProductOptions,
    shopifyAiCreateProductRecord,
    shopifyAiCreateProductVariants,
    shopifyAiCreateRefund,
    shopifyAiCreateScriptTag,
    shopifyAiCreateSmartCollection,
    shopifyAiCreateTheme,
    shopifyAiCreateUrlRedirect,
    shopifyAiDeactivateGiftCard,
    shopifyAiDeactivateInventoryAtLocation,
    shopifyAiDeleteArticle,
    shopifyAiDeleteBlog,
    shopifyAiDeleteCollection,
    shopifyAiDeleteComment,
    shopifyAiDeleteCustomerAddress,
    shopifyAiDeleteCustomer,
    shopifyAiDeleteDiscountRedeemCodes,
    shopifyAiDeleteDiscount,
    shopifyAiDeleteDraftOrder,
    shopifyAiDeleteExternalMarketingActivity,
    shopifyAiDeleteFulfillmentService,
    shopifyAiDeleteMetafields,
    shopifyAiDeleteMetaobjectDefinition,
    shopifyAiDeleteMetaobject,
    shopifyAiDeleteOrder,
    shopifyAiDeletePage,
    shopifyAiDeleteProductMedia,
    shopifyAiDeleteProductOptions,
    shopifyAiDeleteProductVariants,
    shopifyAiDeleteProduct,
    shopifyAiDeleteSavedSearch,
    shopifyAiDeleteScriptTag,
    shopifyAiDeleteThemeFiles,
    shopifyAiDeleteTheme,
    shopifyAiDeleteUrlRedirect,
    shopifyAiDeleteWebPresence,
    shopifyAiDetachVariantMedia,
    shopifyAiDuplicateProduct,
    shopifyAiEnableStandardMetaobjectDefinition,
    shopifyAiFindDiscountByCode,
    shopifyAiGenerateCustomerActivationUrl,
    shopifyAiGetAbandonment,
    shopifyAiGetArticle,
    shopifyAiGetBlog,
    shopifyAiGetBulkOperation,
    shopifyAiGetBusinessEntity,
    shopifyAiGetCheckoutAbandonment,
    shopifyAiGetCollectionByHandle,
    shopifyAiGetCollection,
    shopifyAiGetCustomerProfile,
    shopifyAiGetDiscountRedeemCodeBulkCreation,
    shopifyAiGetDiscount,
    shopifyAiGetDomain,
    shopifyAiGetDraftOrder,
    shopifyAiGetEvent,
    shopifyAiGetFulfillmentDetails,
    shopifyAiGetFulfillmentOrder,
    shopifyAiGetGiftCard,
    shopifyAiGetGrantedAccessScopes,
    shopifyAiGetInventoryItem,
    shopifyAiGetJob,
    shopifyAiGetLocation,
    shopifyAiGetMarketingEvent,
    shopifyAiGetMetafieldDefinition,
    shopifyAiGetMetafield,
    shopifyAiGetMetaobject,
    shopifyAiGetOnlineStoreSettings,
    shopifyAiGetOrderRiskAssessments,
    shopifyAiGetOrderTransaction,
    shopifyAiGetOrder,
    shopifyAiGetPage,
    shopifyAiGetProductDetails,
    shopifyAiGetProductDuplicateJob,
    shopifyAiGetProductMedia,
    shopifyAiGetProductVariantDetails,
    shopifyAiGetPublication,
    shopifyAiGetRefund,
    shopifyAiGetScriptTag,
    shopifyAiGetShopBillingPreferences,
    shopifyAiGetShop,
    shopifyAiGetThemeFile,
    shopifyAiGetTheme,
    shopifyAiGetUrlRedirect,
    shopifyAiHoldFulfillmentOrder,
    shopifyAiListAbandonedCheckouts,
    shopifyAiListArticleAuthors,
    shopifyAiListArticleTags,
    shopifyAiListArticles,
    shopifyAiListAvailableLocales,
    shopifyAiListBlogs,
    shopifyAiListBulkOperations,
    shopifyAiListBusinessEntities,
    shopifyAiListCarrierServices,
    shopifyAiListCatalogs,
    shopifyAiListCollectionProducts,
    shopifyAiListComments,
    shopifyAiListConsentPolicies,
    shopifyAiListConsentPolicyRegions,
    shopifyAiListCustomerAccountPages,
    shopifyAiListCustomerAddresses,
    shopifyAiListCustomerOrders,
    shopifyAiListDeliveryProfiles,
    shopifyAiListDiscountRedeemCodes,
    shopifyAiListDiscounts,
    shopifyAiListDraftOrders,
    shopifyAiListEnabledCurrencies,
    shopifyAiListEvents,
    shopifyAiListFulfillmentEvents,
    shopifyAiListFulfillmentOrderMoveLocations,
    shopifyAiListFulfillmentServices,
    shopifyAiListInventoryItems,
    shopifyAiListInventoryLevels,
    shopifyAiListLocations,
    shopifyAiListMarketingEvents,
    shopifyAiListMetafieldDefinitionTypes,
    shopifyAiListMetafieldDefinitions,
    shopifyAiListMetafields,
    shopifyAiListMetaobjectDefinitions,
    shopifyAiListMetaobjects,
    shopifyAiListOrderFulfillmentOrders,
    shopifyAiListOrderFulfillments,
    shopifyAiListOrderRefunds,
    shopifyAiListOrderTransactions,
    shopifyAiListPages,
    shopifyAiListPaymentDisputes,
    shopifyAiListPaymentTermsTemplates,
    shopifyAiListProductMedia,
    shopifyAiListProductVariants,
    shopifyAiListPublications,
    shopifyAiListSalesChannels,
    shopifyAiListSavedSearches,
    shopifyAiListScriptTags,
    shopifyAiListShopPayPaymentRequestReceipts,
    shopifyAiListShopPolicies,
    shopifyAiListStandardMetafieldDefinitionTemplates,
    shopifyAiListTenderTransactions,
    shopifyAiListThemeFiles,
    shopifyAiListThemes,
    shopifyAiListUrlRedirects,
    shopifyAiListWebPresences,
    shopifyAiMarkCommentNotSpam,
    shopifyAiMarkCommentSpam,
    shopifyAiMarkOrderAsPaid,
    shopifyAiMoveFulfillmentOrder,
    shopifyAiPinMetafieldDefinition,
    shopifyAiPublishResource,
    shopifyAiPublishTheme,
    shopifyAiReleaseFulfillmentOrderHold,
    shopifyAiRemoveProductsFromCollection,
    shopifyAiRemoveTags,
    shopifyAiReorderCollectionProducts,
    shopifyAiReorderProductMedia,
    shopifyAiReorderProductOptions,
    shopifyAiReorderProductVariants,
    shopifyAiSearchCollections,
    shopifyAiSearchCustomers,
    shopifyAiSearchGiftCards,
    shopifyAiSearchOrders,
    shopifyAiSearchProductTaxonomy,
    shopifyAiSearchProducts,
    shopifyAiSendCustomerAccountInvite,
    shopifyAiSendDraftOrderInvoice,
    shopifyAiSetDefaultCustomerAddress,
    shopifyAiSetFulfillmentOrdersDeadline,
    shopifyAiSetInventoryQuantities,
    shopifyAiSetMetafields,
    shopifyAiSetProduct,
    shopifyAiStartBulkMutation,
    shopifyAiStartBulkQuery,
    shopifyAiStartOrderCancellation,
    shopifyAiUnarchiveOrder,
    shopifyAiUnpublishResource,
    shopifyAiUpdateArticle,
    shopifyAiUpdateBasicDiscountCode,
    shopifyAiUpdateBlog,
    shopifyAiUpdateCollection,
    shopifyAiUpdateCustomerAddress,
    shopifyAiUpdateCustomerProfile,
    shopifyAiUpdateDraftOrder,
    shopifyAiUpdateExternalMarketingActivity,
    shopifyAiUpdateFreeShippingDiscountCode,
    shopifyAiUpdateFulfillmentTracking,
    shopifyAiUpdateGiftCard,
    shopifyAiUpdateInventoryItem,
    shopifyAiUpdateMetafieldDefinition,
    shopifyAiUpdateOrderDetails,
    shopifyAiUpdatePage,
    shopifyAiUpdateProductFields,
    shopifyAiUpdateProductMedia,
    shopifyAiUpdateProductOption,
    shopifyAiUpdateProductVariants,
    shopifyAiUpdateScriptTag,
    shopifyAiUpdateTheme,
    shopifyAiUpdateUrlRedirect,
    shopifyAiUpsertExternalMarketingActivity,
    shopifyAiUpsertMetaobject,
    shopifyAiUpsertThemeFiles,
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
