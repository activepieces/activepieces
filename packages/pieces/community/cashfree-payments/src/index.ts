import {
  createPiece,
} from '@activepieces/pieces-framework';
import { createOrder } from './lib/actions/create-order';
import { createPaymentLink } from './lib/actions/create-payment-link';
import { createRefund } from './lib/actions/create-refund';
import { cancelPaymentLink } from './lib/actions/cancel-payment-link';
import { fetchPaymentLinkDetails } from './lib/actions/fetch-payment-link-details';
import { createCashgram } from './lib/actions/create-cashgram';
import { getOrdersForPaymentLink } from './lib/actions/get-orders-for-payment-link';
import { getAllRefundsForOrder } from './lib/actions/get-all-refunds-for-order';
import { deactivateCashgram } from './lib/actions/deactivate-cashgram';
import { cashfreeAuth } from './lib/common/auth';

export const cashfreeTriggers = createPiece({
  displayName: 'Cashfree Payments',
  auth: cashfreeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/cashfreepayments.png',
  authors: ['kartikvyaas','sanket-a11y'],
  actions: [
    createOrder,
    createPaymentLink,
    createRefund,
    cancelPaymentLink,
    fetchPaymentLinkDetails,
    createCashgram,
    getOrdersForPaymentLink,
    getAllRefundsForOrder,
    deactivateCashgram,
  ],
  triggers: [],
});
