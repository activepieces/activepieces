import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { mollieAuth } from './lib/common/common';
import { newCustomerTrigger } from './lib/triggers/new-customer';
import { newOrderTrigger } from './lib/triggers/new-order';
import { newSettlementTrigger } from './lib/triggers/new-settlement';
import { newInvoiceTrigger } from './lib/triggers/new-invoice';
import { newPaymentTrigger } from './lib/triggers/new-payment';
import { newRefundTrigger } from './lib/triggers/new-refund';
import { newPaymentChargebackTrigger } from './lib/triggers/new-payment-chargeback';
import { createOrderAction } from './lib/actions/create-order';
import { createPaymentLinkAction } from './lib/actions/create-payment-link';
import { createPaymentAction } from './lib/actions/create-payment';
import { createCustomerAction } from './lib/actions/create-customer';
import { createRefundAction } from './lib/actions/create-payment-refund';
import { searchOrderAction } from './lib/actions/search-order';
import { searchPaymentAction } from './lib/actions/search-payment';
import { searchCustomerAction } from './lib/actions/search-customer';

export const mollie = createPiece({
  displayName: 'Mollie',
  description: 'Online payment service for businesses to process payments, orders, refunds, and manage customers',
  auth: mollieAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mollie.png',
  categories: [PieceCategory.PAYMENT_PROCESSING],
  authors: ['Ani-4x'],
  triggers: [
    newCustomerTrigger,
    newOrderTrigger,
    newSettlementTrigger,
    newInvoiceTrigger,
    newPaymentTrigger,
    newRefundTrigger,
    newPaymentChargebackTrigger,
  ],
  actions: [
    createOrderAction,
    createPaymentLinkAction,
    createPaymentAction,
    createCustomerAction,
    createRefundAction,
    searchOrderAction,
    searchPaymentAction,
    searchCustomerAction,
  ],
});
