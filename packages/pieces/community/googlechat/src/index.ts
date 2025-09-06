import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from './lib/common/constants';
import { newMessage } from './lib/triggers/new-message';
import { newMention } from './lib/triggers/new-mention';
import { sendAMessage } from './lib/actions/send-a-message';
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';
import { addASpaceMember } from './lib/actions/add-a-space-member';
import { getMessage } from './lib/actions/get-message';
import { searchMessages } from './lib/actions/search-messages';
import { findMember } from './lib/actions/find-member';

export const googlechat = createPiece({
  displayName: 'Googlechat',
  auth: googleChatApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/googlechat.png',
  authors: ["gs03-dev"],
  actions: [
    sendAMessage,
    getDirectMessageDetails,
    addASpaceMember,
    getMessage,
    searchMessages,
    findMember
  ],
  triggers: [
    newMessage,
    newMention
  ],
});
