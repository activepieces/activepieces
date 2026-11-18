import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sallaAuth } from './lib/auth';
import { BASE_URL } from './lib/common/client';
import { getOrderAction } from './lib/actions/get-order';
import { findOrdersAction } from './lib/actions/find-orders';
import { updateOrderStatusAction } from './lib/actions/update-order-status';
import { cancelOrderAction } from './lib/actions/cancel-order';
import { createOrderAction } from './lib/actions/create-order';
import { updateOrderAction } from './lib/actions/update-order';
import { addOrderNoteAction } from './lib/actions/add-order-note';
import { listOrderItemsAction } from './lib/actions/list-order-items';
import { getOrderInvoicePdfAction } from './lib/actions/get-order-invoice-pdf';
import { sendOrderInvoiceAction } from './lib/actions/send-order-invoice';
import { aiListOrdersAction } from './lib/actions/ai/list-orders';
import { aiUpdateOrderStatusAction } from './lib/actions/ai/update-order-status';
import { aiCreateOrderAction } from './lib/actions/ai/create-order';
import { aiUpdateOrderAction } from './lib/actions/ai/update-order';
import { aiListOrderStatusesAction } from './lib/actions/ai/list-order-statuses';
import { aiListPaymentMethodsAction } from './lib/actions/ai/list-payment-methods';
import { aiListBranchesAction } from './lib/actions/ai/list-branches';
import { aiGetStoreInfoAction } from './lib/actions/ai/get-store-info';
import { newOrderTrigger } from './lib/triggers/new-order';
import { orderStatusChangedTrigger } from './lib/triggers/order-status-changed';
import { orderUpdatedTrigger } from './lib/triggers/order-updated';
import { orderCancelledTrigger } from './lib/triggers/order-cancelled';
import { orderRefundedTrigger } from './lib/triggers/order-refunded';
import { orderPaymentUpdatedTrigger } from './lib/triggers/order-payment-updated';
import { createProductAction } from './lib/actions/create-product';
import { updateProductAction } from './lib/actions/update-product';
import { getProductAction } from './lib/actions/get-product';
import { findProductsAction } from './lib/actions/find-products';
import { deleteProductAction } from './lib/actions/delete-product';
import { changeProductStatusAction } from './lib/actions/change-product-status';
import { adjustStockAction } from './lib/actions/adjust-stock';
import { updateProductPriceAction } from './lib/actions/update-product-price';
import { updateVariantAction } from './lib/actions/update-variant';
import { addProductImageAction } from './lib/actions/add-product-image';
import { aiCreateProductAction } from './lib/actions/ai/create-product';
import { aiUpdateProductAction } from './lib/actions/ai/update-product';
import { aiListProductsAction } from './lib/actions/ai/list-products';
import { aiAdjustStockAction } from './lib/actions/ai/adjust-stock';
import { aiUpdateVariantAction } from './lib/actions/ai/update-variant';
import { aiAddProductImageAction } from './lib/actions/ai/add-product-image';
import { aiListCategoriesAction } from './lib/actions/ai/list-categories';
import { aiListBrandsAction } from './lib/actions/ai/list-brands';
import { aiListStockChangeReasonsAction } from './lib/actions/ai/list-stock-change-reasons';
import { newProductTrigger } from './lib/triggers/new-product';
import { productLowStockTrigger } from './lib/triggers/product-low-stock';
import { productPriceOrStatusChangedTrigger } from './lib/triggers/product-price-or-status-changed';
import { createCustomerAction } from './lib/actions/create-customer';
import { updateCustomerAction } from './lib/actions/update-customer';
import { getCustomerAction } from './lib/actions/get-customer';
import { findCustomersAction } from './lib/actions/find-customers';
import { addCustomersToGroupAction } from './lib/actions/add-customers-to-group';
import { createCouponAction } from './lib/actions/create-coupon';
import { findCouponsAction } from './lib/actions/find-coupons';
import { getCouponAction } from './lib/actions/get-coupon';
import { findAbandonedCartsAction } from './lib/actions/find-abandoned-carts';
import { getAbandonedCartAction } from './lib/actions/get-abandoned-cart';
import { aiCreateCustomerAction } from './lib/actions/ai/create-customer';
import { aiUpdateCustomerAction } from './lib/actions/ai/update-customer';
import { aiListCustomersAction } from './lib/actions/ai/list-customers';
import { aiAddCustomersToGroupAction } from './lib/actions/ai/add-customers-to-group';
import { aiCreateCouponAction } from './lib/actions/ai/create-coupon';
import { aiListCouponsAction } from './lib/actions/ai/list-coupons';
import { aiListAbandonedCartsAction } from './lib/actions/ai/list-abandoned-carts';
import { aiListCustomerGroupsAction } from './lib/actions/ai/list-customer-groups';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { customerUpdatedTrigger } from './lib/triggers/customer-updated';
import { abandonedCartTrigger } from './lib/triggers/abandoned-cart';
import { newReviewTrigger } from './lib/triggers/new-review';
import { anyStoreEventTrigger } from './lib/triggers/any-store-event';

export const salla = createPiece({
  displayName: 'Salla',
  description: 'Saudi e-commerce platform for online stores: manage orders, products, stock, customers and coupons, and react to store events.',
  auth: sallaAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/salla.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['ibrahim-abuznaid'],
  actions: [
    getOrderAction,
    findOrdersAction,
    updateOrderStatusAction,
    cancelOrderAction,
    createOrderAction,
    updateOrderAction,
    addOrderNoteAction,
    listOrderItemsAction,
    getOrderInvoicePdfAction,
    sendOrderInvoiceAction,
    aiListOrdersAction,
    aiUpdateOrderStatusAction,
    aiCreateOrderAction,
    aiUpdateOrderAction,
    aiListOrderStatusesAction,
    aiListPaymentMethodsAction,
    aiListBranchesAction,
    aiGetStoreInfoAction,
    createProductAction,
    updateProductAction,
    getProductAction,
    findProductsAction,
    deleteProductAction,
    changeProductStatusAction,
    adjustStockAction,
    updateProductPriceAction,
    updateVariantAction,
    addProductImageAction,
    aiCreateProductAction,
    aiUpdateProductAction,
    aiListProductsAction,
    aiAdjustStockAction,
    aiUpdateVariantAction,
    aiAddProductImageAction,
    aiListCategoriesAction,
    aiListBrandsAction,
    aiListStockChangeReasonsAction,
    createCustomerAction,
    updateCustomerAction,
    getCustomerAction,
    findCustomersAction,
    addCustomersToGroupAction,
    createCouponAction,
    findCouponsAction,
    getCouponAction,
    findAbandonedCartsAction,
    getAbandonedCartAction,
    aiCreateCustomerAction,
    aiUpdateCustomerAction,
    aiListCustomersAction,
    aiAddCustomersToGroupAction,
    aiCreateCouponAction,
    aiListCouponsAction,
    aiListAbandonedCartsAction,
    aiListCustomerGroupsAction,
    createCustomApiCallAction({
      auth: sallaAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newOrderTrigger,
    orderStatusChangedTrigger,
    orderUpdatedTrigger,
    orderCancelledTrigger,
    orderRefundedTrigger,
    orderPaymentUpdatedTrigger,
    newProductTrigger,
    productLowStockTrigger,
    productPriceOrStatusChangedTrigger,
    newCustomerTrigger,
    customerUpdatedTrigger,
    abandonedCartTrigger,
    newReviewTrigger,
    anyStoreEventTrigger,
  ],
});
