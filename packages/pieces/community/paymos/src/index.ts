import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { paymosActions, paymosAuth } from './lib/actions';
import { paymosWebhookEventTrigger } from './lib/triggers/webhook-event';

export { paymosAuth };

export const paymos = createPiece({
  displayName: 'Paymos',
  description:
    'Accept stablecoin (USDT, USDC, USD1, DAI) and gold-backed XAUT payments across 13 networks, manage Payment Channels and invoice refunds, and trigger flows on verified Paymos webhooks.',
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://raw.githubusercontent.com/Paymos-labs/mcp/v1.11.1/assets/logo-256.png',
  authors: ['paymos-dev'],
  categories: [PieceCategory.PAYMENT_PROCESSING],
  auth: paymosAuth,
  actions: paymosActions,
  triggers: [paymosWebhookEventTrigger],
});
