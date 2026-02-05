import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from './lib/common/constants';
import { newMessage } from './lib/triggers/new-message';
import { newMention } from './lib/triggers/new-mention';
import { sendAMessage } from './lib/actions/send-a-message';
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details';
import { addASpaceMember } from './lib/actions/add-a-space-member';
import { getMessageDetails } from './lib/actions/get-message';
import { searchMessages } from './lib/actions/search-messages';
import { findMember } from './lib/actions/find-member';
import { PieceCategory } from '@activepieces/shared';

export const googlechat = createPiece({
  displayName: 'Google Chat',
  auth: googleChatApiAuth,
  minimumSupportedRelease: '0.36.1',
  description: 'Google Chat is a messaging app that allows you to send and receive messages, create spaces, and more.',
  logoUrl: 'https://cdn.activepieces.com/pieces/googlechat.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["gs03-dev", "onyedikachi-david"],
  actions: [
    sendAMessage,
    getDirectMessageDetails,
    addASpaceMember,
    getMessageDetails,
    searchMessages,
    findMember
  ],
  triggers: [
    newMessage,
    newMention
  ],
});
