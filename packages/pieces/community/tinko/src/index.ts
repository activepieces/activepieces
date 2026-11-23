import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addNoteToContactAction } from './lib/actions/add-note-to-contact';
import { addTagToContactAction } from './lib/actions/add-tag-to-contact';
import { closeChatAction } from './lib/actions/close-chat';
import { createContactAction } from './lib/actions/create-contact';
import { createTagAction } from './lib/actions/create-tag';
import { findContactAction } from './lib/actions/find-contact';
import { sendMediaMessageAction } from './lib/actions/send-media-message';
import { sendTemplateMessageAction } from './lib/actions/send-template-message';
import { sendTextMessageAction } from './lib/actions/send-text-message';
import { transferChatAction } from './lib/actions/transfer-chat';
import { updateContactAction } from './lib/actions/update-contact';
import { tinkoAuth } from './lib/auth';
import { TINKO_API_BASE_URL } from './lib/common/client';
import { channelStatusChangedTrigger } from './lib/triggers/channel-status-changed';
import { chatEndedTrigger } from './lib/triggers/chat-ended';
import { chatTransferredTrigger } from './lib/triggers/chat-transferred';
import { newChatTrigger } from './lib/triggers/new-chat';
import { newMessageReceivedTrigger } from './lib/triggers/new-message-received';
import { newMessageSentTrigger } from './lib/triggers/new-message-sent';

export const tinko = createPiece({
  displayName: 'Tinko',
  description:
    'Omnichannel customer service platform for WhatsApp, Instagram and site chat, with a shared inbox, AI agents and CRM.',
  auth: tinkoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tinko.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.CUSTOMER_SUPPORT],
  authors: ['thallesbrandao'],
  actions: [
    sendTextMessageAction,
    sendMediaMessageAction,
    sendTemplateMessageAction,
    createContactAction,
    updateContactAction,
    findContactAction,
    addTagToContactAction,
    addNoteToContactAction,
    transferChatAction,
    closeChatAction,
    createTagAction,
    createCustomApiCallAction({
      auth: tinkoAuth,
      baseUrl: () => TINKO_API_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        Accept: 'application/json',
      }),
    }),
  ],
  triggers: [
    newMessageReceivedTrigger,
    newMessageSentTrigger,
    newChatTrigger,
    chatEndedTrigger,
    chatTransferredTrigger,
    channelStatusChangedTrigger,
  ],
});
