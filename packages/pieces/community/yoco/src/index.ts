import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { yocoAuth } from './lib/auth';
import { createCheckoutAction } from './lib/actions/create-checkout.action';
import { getCheckoutAction } from './lib/actions/get-checkout.action';
import { refundPaymentAction } from './lib/actions/refund-payment.action';
import { paymentSucceededTrigger } from './lib/triggers/payment-succeeded.trigger';

export const yoco = createPiece({
  displayName: 'Yoco',
  description:
    'South African card payments. Create checkout sessions, look up payments, issue refunds, and react to successful payments.',
  minimumSupportedRelease: '0.92.0',
  logoUrl:
    'https://res.cloudinary.com/dewvhnks3/image/upload/v1791576726/images_5_gcxgkm.png',
  categories: [PieceCategory.PAYMENT_PROCESSING, PieceCategory.COMMERCE],
  auth: yocoAuth,
  authors: ['synkra'],
  actions: [
    createCheckoutAction,
    getCheckoutAction,
    refundPaymentAction,
  ],
  triggers: [paymentSucceededTrigger],
});
