import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchWebhook } from './lib/triggers/catch-hook';

export const webhook = createPiece({
  displayName: 'Webhook',
  description: 'Receive HTTP requests and trigger flows using unique URLs.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.22.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webhook.svg',
  authors: ['abuaboud', 'pfernandez98'],
  actions: [],
  triggers: [catchWebhook],
});
