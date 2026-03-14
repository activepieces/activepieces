import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendNotification } from './actions/send-notification';

export const ntfy = createPiece({
  displayName: 'ntfy.sh',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ntfy.png', // Assuming or host standard logo
  authors: ['mousko'],
  actions: [
    sendNotification,
  ],
  triggers: [],
});
