import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mpesaAuth } from './lib/auth';
import { stkPush } from './lib/actions/stk-push';
import { c2bSimulate } from './lib/actions/c2b-simulate';
import { b2cPayment } from './lib/actions/b2c-payment';
import { b2bPayment } from './lib/actions/b2b-payment';
import { c2bPaymentReceived } from './lib/triggers/c2b-payment-received';

export const mpesa = createPiece({
  displayName: 'M-Pesa',
  description: 'Accept and send M-Pesa payments through Safaricom Daraja: Express (STK), C2B, B2C, and B2B.',
  auth: mpesaAuth,
  minimumSupportedRelease: '0.86.0',
  logoUrl: 'https://raw.githubusercontent.com/sudoevans/activepieces-mpesa/main/packages/pieces/community/mpesa/assets/mpesa.svg',
  authors: ['sudoevans'],
  categories: [PieceCategory.PAYMENT_PROCESSING],
  actions: [stkPush, c2bSimulate, b2cPayment, b2bPayment],
  triggers: [c2bPaymentReceived],
});
