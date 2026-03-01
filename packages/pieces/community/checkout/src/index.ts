import { createPiece } from '@activepieces/pieces-framework';
import { checkoutComAuth } from './lib/common/auth';
import { createCustomerAction } from './lib/actions/create-customer';
import { updateCustomerAction } from './lib/actions/update-customer';
import { createPaymentLinkAction } from './lib/actions/create-payment-link';
import { createPayoutAction } from './lib/actions/create-payout';
import { refundPaymentAction } from './lib/actions/refund-payment';
import { getPaymentDetailsAction } from './lib/actions/get-payment-details';
import { getPaymentActionsAction } from './lib/actions/get-payment-actions';
import { paymentEventsTrigger } from './lib/triggers/payment-events';
import { disputeEventsTrigger } from './lib/triggers/dispute-events';

export const checkout = createPiece({
  displayName: 'Checkout.com',
  auth: checkoutComAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/checkout.png',
  authors: ['sparkybug','onyedikachi-david'],
  actions: [
    createCustomerAction,
    updateCustomerAction,
    createPaymentLinkAction,
    createPayoutAction,
    refundPaymentAction,
    getPaymentDetailsAction,
    getPaymentActionsAction,
  ],
  triggers: [paymentEventsTrigger, disputeEventsTrigger],
}); 