import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { kapsoAuth, KAPSO_BASE_URL } from './lib/common';
import { sendTextMessage } from './lib/actions/send-text-message';
import { sendButtons } from './lib/actions/send-buttons';
import { sendList } from './lib/actions/send-list';
import { sendImage } from './lib/actions/send-image';
import { sendVideo } from './lib/actions/send-video';
import { sendAudio } from './lib/actions/send-audio';
import { sendDocument } from './lib/actions/send-document';
import { sendSticker } from './lib/actions/send-sticker';
import { sendLocation } from './lib/actions/send-location';
import { requestLocation } from './lib/actions/request-location';
import { sendContact } from './lib/actions/send-contact';
import { sendReaction } from './lib/actions/send-reaction';
import { markAsRead } from './lib/actions/mark-as-read';
import { sendTemplate } from './lib/actions/send-template';
import { newMessage } from './lib/triggers/new-message';
import { messageStatusUpdate } from './lib/triggers/message-status-update';

export const kapso = createPiece({
  displayName: 'Kapso',
  description: 'Send and receive WhatsApp messages, media, templates, and more using the Kapso WhatsApp API.',
  auth: kapsoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kapso.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['onyedikachi-david'],
  actions: [
    sendTextMessage,
    sendButtons,
    sendList,
    sendImage,
    sendVideo,
    sendAudio,
    sendDocument,
    sendSticker,
    sendLocation,
    requestLocation,
    sendContact,
    sendReaction,
    markAsRead,
    sendTemplate,
    createCustomApiCallAction({
      auth: kapsoAuth,
      baseUrl: () => KAPSO_BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-Key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [newMessage, messageStatusUpdate],
});