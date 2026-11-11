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

export const salla = createPiece({
  displayName: 'Salla',
  description: 'Saudi e-commerce platform for online stores: manage orders and react to order events.',
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
  ],
});
