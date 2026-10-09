import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { ikhokhaAuth } from './lib/auth';
import { createPaymentLinkAction } from './lib/actions/create-payment-link.action';
import { getPaymentAction } from './lib/actions/get-payment.action';
import { refundPaymentAction } from './lib/actions/refund-payment.action';
import { paymentReceivedTrigger } from './lib/triggers/payment-received.trigger';

export const ikhokha = createPiece({
  displayName: 'iKhokha',
  description:
    'South African card and mobile payments. Create payment links, look up payments, issue refunds, and react to incoming payments.',
  minimumSupportedRelease: '0.92.0',
  logoUrl:
    'https://res.cloudinary.com/dewvhnks3/image/upload/v1791576727/unnamed_kjxcga.png',
  categories: [PieceCategory.PAYMENT_PROCESSING, PieceCategory.COMMERCE],
  auth: ikhokhaAuth,
  authors: ['synkra'],
  actions: [
    createPaymentLinkAction,
    getPaymentAction,
    refundPaymentAction,
  ],
  triggers: [paymentReceivedTrigger],
});
