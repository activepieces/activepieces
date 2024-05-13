import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchWebhook } from './lib/triggers/catch-hook';
import { PieceCategory } from '@activepieces/shared';

export const webhook = createPiece({
  displayName: 'Webhook',
  description: 'Receive HTTP requests and trigger flows using unique URLs.',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.26.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webhook.svg',
  authors: ['abuaboud', 'pfernandez98'],
  actions: [],
  triggers: [catchWebhook],
});
