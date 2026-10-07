import crypto from 'crypto';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { squareAuth } from './lib/auth';
import { squareClient } from './lib/common/client';
import { triggers } from './lib/triggers';
import { adjustInventoryAction } from './lib/actions/adjust-inventory';
import { adjustInventoryByIdAction } from './lib/actions/ai/adjust-inventory-by-id';
import { createCatalogItemAction } from './lib/actions/create-catalog-item';
import { createCatalogItemByIdAction } from './lib/actions/ai/create-catalog-item-by-id';
import { createCustomerAction } from './lib/actions/create-customer';
import { createOrderAction } from './lib/actions/create-order';
import { createOrderByIdAction } from './lib/actions/ai/create-order-by-id';
import { createPaymentLinkAction } from './lib/actions/create-payment-link';
import { createPaymentLinkByIdAction } from './lib/actions/ai/create-payment-link-by-id';
import { deleteCatalogObjectAction } from './lib/actions/delete-catalog-object';
import { deleteCustomerAction } from './lib/actions/delete-customer';
import { deleteCustomerByIdAction } from './lib/actions/ai/delete-customer-by-id';
import { findCustomersAction } from './lib/actions/find-customers';
import { getCatalogItemAction } from './lib/actions/get-catalog-item';
import { getCustomerAction } from './lib/actions/get-customer';
import { getCustomerByIdAction } from './lib/actions/ai/get-customer-by-id';
import { getInventoryCountAction } from './lib/actions/get-inventory-count';
import { getInventoryCountByIdAction } from './lib/actions/ai/get-inventory-count-by-id';
import { getMerchantAction } from './lib/actions/get-merchant';
import { getOrderAction } from './lib/actions/get-order';
import { getPaymentAction } from './lib/actions/get-payment';
import { getRefundAction } from './lib/actions/get-refund';
import { listLocationsAction } from './lib/actions/list-locations';
import { listPaymentsAction } from './lib/actions/list-payments';
import { listRefundsAction } from './lib/actions/list-refunds';
import { listTeamMembersAction } from './lib/actions/list-team-members';
import { recordExternalPaymentAction } from './lib/actions/record-external-payment';
import { refundPaymentAction } from './lib/actions/refund-payment';
import { searchCatalogItemsAction } from './lib/actions/search-catalog-items';
import { searchOrdersAction } from './lib/actions/search-orders';
import { searchOrdersByIdAction } from './lib/actions/ai/search-orders-by-id';
import { setInventoryCountAction } from './lib/actions/set-inventory-count';
import { setInventoryCountByIdAction } from './lib/actions/ai/set-inventory-count-by-id';
import { updateCustomerAction } from './lib/actions/update-customer';
import { updateCustomerByIdAction } from './lib/actions/ai/update-customer-by-id';
import { updateItemVariationPriceAction } from './lib/actions/update-item-variation-price';
import { updateItemVariationPriceByIdAction } from './lib/actions/ai/update-item-variation-price-by-id';
import { updateOrderStateAction } from './lib/actions/update-order-state';

export const square = createPiece({
  displayName: 'Square',
  description: 'Payment solutions for every business',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/square.png',
  categories: [PieceCategory.COMMERCE],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  auth: squareAuth,
  events: {
    verify: ({ webhookSecret, payload, appWebhookUrl }) => {
      const header = payload.headers['x-square-hmacsha256-signature'];
      const signature = Array.isArray(header) ? header[0] : header;
      if (typeof signature !== 'string' || signature.length === 0 || typeof webhookSecret !== 'string' || webhookSecret.length === 0) {
        return false;
      }
      const expected = crypto.createHmac('sha256', webhookSecret).update(appWebhookUrl + payload.rawBody).digest();
      const received = Buffer.from(signature, 'base64');
      return received.length === expected.length && crypto.timingSafeEqual(received, expected);
    },
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as Payload | undefined;
      return {
        event: payloadBody?.type,
        identifierValue: payloadBody?.merchant_id,
      };
    },
  },
  actions: [
    getMerchantAction,
    listLocationsAction,
    listTeamMembersAction,
    createCustomerAction,
    findCustomersAction,
    getCustomerAction,
    updateCustomerAction,
    deleteCustomerAction,
    searchCatalogItemsAction,
    getCatalogItemAction,
    createCatalogItemAction,
    updateItemVariationPriceAction,
    deleteCatalogObjectAction,
    getInventoryCountAction,
    adjustInventoryAction,
    setInventoryCountAction,
    createOrderAction,
    getOrderAction,
    searchOrdersAction,
    updateOrderStateAction,
    getPaymentAction,
    listPaymentsAction,
    recordExternalPaymentAction,
    refundPaymentAction,
    getRefundAction,
    listRefundsAction,
    createPaymentLinkAction,
    getCustomerByIdAction,
    updateCustomerByIdAction,
    deleteCustomerByIdAction,
    createCatalogItemByIdAction,
    updateItemVariationPriceByIdAction,
    getInventoryCountByIdAction,
    adjustInventoryByIdAction,
    setInventoryCountByIdAction,
    createOrderByIdAction,
    searchOrdersByIdAction,
    createPaymentLinkByIdAction,
    createCustomApiCallAction({
      baseUrl: () => squareClient.BASE_URL,
      auth: squareAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
        'Square-Version': squareClient.SQUARE_VERSION,
      }),
    }),
  ],
  triggers,
});

type Payload = {
  type: string;
  merchant_id: string;
};
