import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { mollieCreateOrder } from './lib/actions/create-order';
import { mollieCreatePaymentLink } from './lib/actions/create-payment-link';
import { mollieCreatePayment } from './lib/actions/create-payment';
import { mollieCreateCustomer } from './lib/actions/create-customer';
import { mollieCreatePaymentRefund } from './lib/actions/create-payment-refund';
import { mollieSearchOrder } from './lib/actions/search-order';
import { mollieSearchPayment } from './lib/actions/search-payment';
import { mollieSearchCustomer } from './lib/actions/search-customer';
import { mollieNewCustomer } from './lib/triggers/new-customer';
import { mollieNewOrder } from './lib/triggers/new-order';
import { mollieNewSettlement } from './lib/triggers/new-settlement';
import { mollieNewInvoice } from './lib/triggers/new-invoice';
import { mollieNewPayment } from './lib/triggers/new-payment';
import { mollieNewRefund } from './lib/triggers/new-refund';
import { mollieNewChargeback } from './lib/triggers/new-chargeback';

export const mollieAuth = PieceAuth.OAuth2({
  description: 'Connect your Mollie account',
  authUrl: 'https://my.mollie.com/oauth2/authorize',
  tokenUrl: 'https://api.mollie.com/oauth2/tokens',
  required: true,
  scope: [
    'orders.write',
    'payment-links.write',
    'payments.write',
    'customers.write',
    'refunds.write',
    'payments.read',
    'orders.read',
    'customers.read',
    'settlements.read',
    'webhooks.write',
    'refunds.read',
  ],
});

export const mollie = createPiece({
  displayName: 'Mollie',
  auth: mollieAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/mollie.png',
  authors: ['onyedikachi-david', 'Ani-4x'],
  actions: [
    mollieCreateOrder,
    mollieCreatePaymentLink,
    mollieCreatePayment,
    mollieCreateCustomer,
    mollieCreatePaymentRefund,
    mollieSearchOrder,
    mollieSearchPayment,
    mollieSearchCustomer,
  ],
  triggers: [
    mollieNewCustomer,
    mollieNewOrder,
    mollieNewSettlement,
    mollieNewInvoice,
    mollieNewPayment,
    mollieNewRefund,
    mollieNewChargeback,
  ],
});
