import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchWebhook } from './lib/triggers/catch-hook';
import { PieceCategory } from '@activepieces/shared';
import { returnResponse } from './lib/actions/return-response';

export const webhook = createPiece({
  displayName: 'Webhook',
  description: 'Receive HTTP requests and trigger flows using unique URLs.',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/webhook.svg',
  authors: ['abuaboud', 'pfernandez98', 'kishanprmr'],
  actions: [returnResponse],
  triggers: [catchWebhook],
});
