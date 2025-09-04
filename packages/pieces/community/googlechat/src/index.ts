import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from './lib/constants';
import { newMessage } from './lib/triggers/new-message';

export const googlechat = createPiece({
  displayName: 'Googlechat',
  auth: googleChatApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/googlechat.png',
  authors: [],
  actions: [],
  triggers: [
    newMessage
  ],
});
