import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import {
  getQawafelBaseUrl,
  PRODUCTION_API_BASE_URL,
  qawafelAuth,
} from './lib/common/auth';

import { createProduct } from './lib/actions/create-product';
import { updateProduct } from './lib/actions/update-product';
import { getProduct } from './lib/actions/get-product';
import { listProducts } from './lib/actions/list-products';
import { createOrder } from './lib/actions/create-order';
import { updateOrderStatus } from './lib/actions/update-order-status';
import { cancelOrder } from './lib/actions/cancel-order';
import { getOrder } from './lib/actions/get-order';
import { listOrders } from './lib/actions/list-orders';
import { createMerchant } from './lib/actions/create-merchant';
import { updateMerchant } from './lib/actions/update-merchant';
import { createInvoice } from './lib/actions/create-invoice';
import { getInvoice } from './lib/actions/get-invoice';
import { listInvoices } from './lib/actions/list-invoices';

import { newOrder } from './lib/triggers/new-order';
import { orderStatusChanged } from './lib/triggers/order-status-changed';
import { invoicePaid } from './lib/triggers/invoice-paid';
import { newInvoice } from './lib/triggers/new-invoice';
import { newProduct } from './lib/triggers/new-product';
import { productUpdated } from './lib/triggers/product-updated';
import { newMerchant } from './lib/triggers/new-merchant';
import { refundRequested } from './lib/triggers/refund-requested';

export { qawafelAuth } from './lib/common/auth';

export const qawafel = createPiece({
  displayName: 'Qawafel',
  description:
    "B2B marketplace and ZATCA-compliant document platform — sync products, orders, merchants and invoices with Saudi Arabia's leading wholesale network.",
  auth: qawafelAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/qawafel.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['sanket-a11y'],
  actions: [
    createProduct,
    updateProduct,
    getProduct,
    listProducts,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrder,
    listOrders,
    createMerchant,
    updateMerchant,
    createInvoice,
    getInvoice,
    listInvoices,
    createCustomApiCallAction({
      auth: qawafelAuth,
      baseUrl: (auth) =>
        auth ? getQawafelBaseUrl(auth) : PRODUCTION_API_BASE_URL,
      authMapping: async (auth) => ({
        'x-qawafel-api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [
    newOrder,
    orderStatusChanged,
    invoicePaid,
    newInvoice,
    newProduct,
    productUpdated,
    newMerchant,
    refundRequested,
  ],
});
