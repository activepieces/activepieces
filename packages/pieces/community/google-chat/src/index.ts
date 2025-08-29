import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleChatAuth } from './lib/common/auth';
import { sendAMessage } from './lib/actions/send-a-message';
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';
import { addASpaceMember } from './lib/actions/add-a-space-member';
import { findMember } from './lib/actions/find-member';
import { getMessage } from './lib/actions/get-message';
import { searchMessages } from './lib/actions/search-messages';
import { send } from 'process';
import { newMessage } from './lib/triggers/new-message';

export const googleChat = createPiece({
  displayName: 'Google-chat',
  auth: googleChatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-chat.png',
  authors: ['Sanket6652'],
  actions: [
    addASpaceMember,
    findMember,
    getDirectMessageDetails,
    getMessage,
    searchMessages,
    sendAMessage,
  ],
  triggers: [
    newMessage
  ],
});
