import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { MollieAuth } from './lib/common/auth';
import { createCustomer } from './lib/actions/create-customer';
import { createOrder } from './lib/actions/create-order';
import { createPaymentLink } from './lib/actions/create-payment-link';
import { createPaymentRefund } from './lib/actions/create-payment-refund';
import { createPayment } from './lib/actions/create-payment';
import { searchCustomer } from './lib/actions/search-customer';
import { searchPayment } from './lib/actions/search-payment';
import { newCustomer } from './lib/triggers/new-customer';
import { newInvoice } from './lib/triggers/new-invoice';
// import { newPaymentChargeback } from './lib/triggers/new-payment-chargeback';
// import { newRefund } from './lib/triggers/new-refund';
import { newSettlement } from './lib/triggers/new-settlement';
import { newOrder } from './lib/triggers/new-order';
import { newPayment } from './lib/triggers/new-payment';
import { searchOrder } from './lib/actions/search-order';

export const mollie = createPiece({
  displayName: 'Mollie',
  auth: MollieAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mollie.png',
  authors: ['Sanket6652'],
  actions: [
    createCustomer,
    createOrder,
    createPaymentLink,
    createPaymentRefund,
    createPayment,
    searchCustomer,
    searchOrder,
  ],
  triggers: [
    newCustomer,
    newInvoice,
    newOrder,
    newPayment,
    // newPaymentChargeback,
    // newRefund,
    newSettlement,
  ],
});
