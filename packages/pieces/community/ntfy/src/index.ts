import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendNotification } from './actions/send-notification';

export const ntfy = createPiece({
  displayName: 'ntfy.sh',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ntfy.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['mousko'],
  actions: [
    sendNotification,
  ],
  triggers: [],
});
