import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { refundPayment } from './actions/refund-payment.action'; // Import the new refundPayment action

export const stripeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Stripe secret API key (e.g., sk_live_... or sk_test_...).',
});

export const stripe = createPiece({
  displayName: 'Stripe',
  minimumSupportedRelease: '0.3.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stripe.png',
  auth: stripeAuth,
  actions: [
    // Register the new refundPayment action as the only action defined in this piece for this deliverable.
    refundPayment,
  ],
  triggers: [], // No triggers are part of this piece or need modification for this bounty.
});