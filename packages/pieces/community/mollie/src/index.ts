import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { mollieCreatePayment } from './lib/actions/create-payment';
import { mollieCreatePaymentLink } from './lib/actions/create-payment-link';
import { mollieCreateCustomer } from './lib/actions/create-customer';
import { mollieCreateRefund } from './lib/actions/create-refund';
import { mollieSearchOrder } from './lib/actions/search-order';
import { mollieSearchPayment } from './lib/actions/search-payment';
import { mollieSearchCustomer } from './lib/actions/search-customer';
import { mollieNewPayment } from './lib/trigger/new-payment';
import { mollieNewCustomer } from './lib/trigger/new-customer';
import { mollieNewOrder } from './lib/trigger/new-order';
import { mollieNewRefund } from './lib/trigger/new-refund';
import { mollieNewSettlement } from './lib/trigger/new-settlement';
import { mollieNewInvoice } from './lib/trigger/new-invoice';
import { molliePaymentChargeback } from './lib/trigger/payment-chargeback';

export const mollieAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Mollie API key (live or test key)',
});

export const mollie = createPiece({
  displayName: 'Mollie',
  description: 'Online payment service provider',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mollie.png',
  authors: ['activepieces'],
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  auth: mollieAuth,
  actions: [
    mollieCreatePayment,
    mollieCreatePaymentLink,
    mollieCreateCustomer,
    mollieCreateRefund,
    mollieSearchOrder,
    mollieSearchPayment,
    mollieSearchCustomer,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.mollie.com/v2',
      auth: mollieAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    mollieNewPayment,
    mollieNewCustomer,
    mollieNewOrder,
    mollieNewRefund,
    mollieNewSettlement,
    mollieNewInvoice,
    molliePaymentChargeback,
  ],
});
