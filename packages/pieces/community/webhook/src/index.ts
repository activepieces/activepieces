import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchWebhook } from './lib/triggers/catch-hook';
import { PieceCategory } from '@activepieces/shared';
import { returnResponse } from './lib/actions/return-response';
import { returnResponseAndWaitForNextWebhook } from './lib/actions/return-response-and-wait-for-next-webhook';

export const webhook = createPiece({
  displayName: 'Webhook',
  description: 'Receive HTTP requests and trigger flows using unique URLs.',
  auth: PieceAuth.None(),
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.52.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webhook.svg',
  authors: ['abuaboud', 'pfernandez98', 'kishanprmr','AbdulTheActivePiecer'],
  actions: [returnResponse,returnResponseAndWaitForNextWebhook],
  triggers: [catchWebhook],
});
