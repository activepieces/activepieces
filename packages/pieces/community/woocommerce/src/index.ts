import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { wooAddOrderNote } from './lib/actions/add-order-note';
import { wooCreateOrder } from './lib/actions/create-order';
import { wooFindCoupon } from './lib/actions/find-coupon';
import { wooFindOrders } from './lib/actions/find-orders';
import { wooGetCustomer } from './lib/actions/get-customer';
import { wooGetOrder } from './lib/actions/get-order';
import { wooUpdateCoupon } from './lib/actions/update-coupon';
import { wooUpdateCustomer } from './lib/actions/update-customer';
import { wooUpdateOrder } from './lib/actions/update-order';
import { wooUpdateProduct } from './lib/actions/update-product';
import { wooCreateCoupon } from './lib/actions/create-coupon';
import { wooCreateCustomer } from './lib/actions/create-customer';
import { wooCreateProduct } from './lib/actions/create-product';
import { wooFindCustomer } from './lib/actions/find-customer';
import { wooFindProduct } from './lib/actions/find-product';
import { wooAiAddOrderNote } from './lib/actions/ai/add-order-note';
import { wooAiBatchUpdateProducts } from './lib/actions/ai/batch-update-products';
import { wooAiCreateCoupon } from './lib/actions/ai/create-coupon';
import { wooAiCreateCustomer } from './lib/actions/ai/create-customer';
import { wooAiCreateOrder } from './lib/actions/ai/create-order';
import { wooAiCreateOrderRefund } from './lib/actions/ai/create-order-refund';
import { wooAiCreateProduct } from './lib/actions/ai/create-product';
import { wooAiCreateProductCategory } from './lib/actions/ai/create-product-category';
import { wooAiCreateProductTag } from './lib/actions/ai/create-product-tag';
import { wooAiDeleteCoupon } from './lib/actions/ai/delete-coupon';
import { wooAiDeleteCustomer } from './lib/actions/ai/delete-customer';
import { wooAiDeleteOrder } from './lib/actions/ai/delete-order';
import { wooAiDeleteOrderNote } from './lib/actions/ai/delete-order-note';
import { wooAiDeleteProduct } from './lib/actions/ai/delete-product';
import { wooAiGetCoupon } from './lib/actions/ai/get-coupon';
import { wooAiGetCustomer } from './lib/actions/ai/get-customer';
import { wooAiGetOrder } from './lib/actions/ai/get-order';
import { wooAiGetOrderTotalsReport } from './lib/actions/ai/get-order-totals-report';
import { wooAiGetProduct } from './lib/actions/ai/get-product';
import { wooAiGetProductVariation } from './lib/actions/ai/get-product-variation';
import { wooAiGetSalesReport } from './lib/actions/ai/get-sales-report';
import { wooAiGetTopSellersReport } from './lib/actions/ai/get-top-sellers-report';
import { wooAiListCoupons } from './lib/actions/ai/list-coupons';
import { wooAiListCustomers } from './lib/actions/ai/list-customers';
import { wooAiListOrderNotes } from './lib/actions/ai/list-order-notes';
import { wooAiListOrderRefunds } from './lib/actions/ai/list-order-refunds';
import { wooAiListOrders } from './lib/actions/ai/list-orders';
import { wooAiListPaymentGateways } from './lib/actions/ai/list-payment-gateways';
import { wooAiListProductCategories } from './lib/actions/ai/list-product-categories';
import { wooAiListProductReviews } from './lib/actions/ai/list-product-reviews';
import { wooAiListProductTags } from './lib/actions/ai/list-product-tags';
import { wooAiListProductVariations } from './lib/actions/ai/list-product-variations';
import { wooAiListProducts } from './lib/actions/ai/list-products';
import { wooAiUpdateCoupon } from './lib/actions/ai/update-coupon';
import { wooAiUpdateCustomer } from './lib/actions/ai/update-customer';
import { wooAiUpdateOrder } from './lib/actions/ai/update-order';
import { wooAiUpdateProduct } from './lib/actions/ai/update-product';
import { wooAiUpdateProductReview } from './lib/actions/ai/update-product-review';
import { wooAiUpdateProductVariation } from './lib/actions/ai/update-product-variation';
import { triggers } from './lib/triggers';
import { wooAuth } from './lib/auth';

const authDescription = `
To generate your API credentials, follow the steps below:
1. Go to WooCommerce -> Settings -> Advanced tab -> REST API.
2. Click on Add Key to create a new key.
3. Enter the key description and change the permissions to Read/Write.
4. Click Generate Key.
5. Copy the Consumer Key and Consumer Secret into the fields below. You will not be able to view the Consumer Secret after exiting the page.

Note that the base URL of your WooCommerce instance needs to be on a secure (HTTPS) connection, or the piece will not work even on local instances on the same device.
`;

export const woocommerce = createPiece({
  displayName: 'WooCommerce',
  description: 'E-commerce platform built on WordPress',

  logoUrl: 'https://cdn.activepieces.com/pieces/woocommerce.png',
  categories: [PieceCategory.COMMERCE],
  auth: wooAuth,
  minimumSupportedRelease: '0.88.2',
  authors: ["TaskMagicKyle","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    wooCreateCustomer,
    wooCreateCoupon,
    wooCreateProduct,
    wooFindCustomer,
    wooFindProduct,
    wooFindCoupon,
    wooGetCustomer,
    wooUpdateCustomer,
    wooUpdateProduct,
    wooUpdateCoupon,
    wooGetOrder,
    wooFindOrders,
    wooCreateOrder,
    wooUpdateOrder,
    wooAddOrderNote,
    wooAiAddOrderNote,
    wooAiBatchUpdateProducts,
    wooAiCreateCoupon,
    wooAiCreateCustomer,
    wooAiCreateOrder,
    wooAiCreateOrderRefund,
    wooAiCreateProduct,
    wooAiCreateProductCategory,
    wooAiCreateProductTag,
    wooAiDeleteCoupon,
    wooAiDeleteCustomer,
    wooAiDeleteOrder,
    wooAiDeleteOrderNote,
    wooAiDeleteProduct,
    wooAiGetCoupon,
    wooAiGetCustomer,
    wooAiGetOrder,
    wooAiGetOrderTotalsReport,
    wooAiGetProduct,
    wooAiGetProductVariation,
    wooAiGetSalesReport,
    wooAiGetTopSellersReport,
    wooAiListCoupons,
    wooAiListCustomers,
    wooAiListOrderNotes,
    wooAiListOrderRefunds,
    wooAiListOrders,
    wooAiListPaymentGateways,
    wooAiListProductCategories,
    wooAiListProductReviews,
    wooAiListProductTags,
    wooAiListProductVariations,
    wooAiListProducts,
    wooAiUpdateCoupon,
    wooAiUpdateCustomer,
    wooAiUpdateOrder,
    wooAiUpdateProduct,
    wooAiUpdateProductReview,
    wooAiUpdateProductVariation,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth?.props.baseUrl ?? ''),
      auth: wooAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${auth.props.consumerKey}:${
            auth.props.consumerSecret
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  triggers: triggers,
});
