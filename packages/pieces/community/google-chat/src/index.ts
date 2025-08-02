import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleChatAuth } from './lib/common/auth';
import { sendAMessage } from './lib/actions/send-a-message';
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';

export const googleChat = createPiece({
  displayName: 'Google-chat',
  auth: googleChatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-chat.png',
  authors: ['Sanket6652'],
  actions: [sendAMessage, getDirectMessageDetails],
  triggers: [],
});
