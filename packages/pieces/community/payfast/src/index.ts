import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { payfastAuth } from './lib/auth';
import { createPaymentAction } from './lib/actions/create-payment.action';
import { getTransactionAction } from './lib/actions/get-transaction.action';
import { refundPaymentAction } from './lib/actions/refund-payment.action';
import { paymentCompleteTrigger } from './lib/triggers/payment-complete.trigger';

export const payfast = createPiece({
  displayName: 'PayFast',
  description:
    'South African payment gateway. Create payment links, process refunds, and react to completed payments in real time.',
  minimumSupportedRelease: '0.92.0',
  logoUrl:
    'https://res.cloudinary.com/dewvhnks3/image/upload/v1791576727/images_4_gpqzzm.png',
  categories: [PieceCategory.PAYMENT_PROCESSING, PieceCategory.COMMERCE],
  auth: payfastAuth,
  authors: ['synkra'],
  actions: [
    createPaymentAction,
    getTransactionAction,
    refundPaymentAction,
  ],
  triggers: [paymentCompleteTrigger],
});
