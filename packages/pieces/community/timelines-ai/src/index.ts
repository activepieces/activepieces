import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { closeChat } from './lib/actions/close-chat';
import { findChat } from './lib/actions/find-chat';
import { findMessage } from './lib/actions/find-message';
import { findMessageStatus } from './lib/actions/find-message-status';
import { findUploadedFile } from './lib/actions/find-uploaded-file';
import { findWhatsappAccount } from './lib/actions/find-whatsapp-account';
import { sendFileToExistingChat } from './lib/actions/send-file-to-existing-chat';
import { sendMessageToExistingChat } from './lib/actions/send-message-to-existing-chat';
import { sendMessageToNewChat } from './lib/actions/send-message-to-new-chat';
import { sendUploadedFileToExistingChat } from './lib/actions/send-uploaded-file-to-existing-chat';
import { timelinesAiAuth, timelinesAiCommon } from './lib/common';
import { chatClosed } from './lib/triggers/chat-closed';
import { chatRenamed } from './lib/triggers/chat-renamed';
import { newIncomingChat } from './lib/triggers/new-incoming-chat';
import { newOutgoingChat } from './lib/triggers/new-outgoing-chat';
import { newReceivedMessage } from './lib/triggers/new-received-message';
import { newSentMessage } from './lib/triggers/new-sent-message';
import { newUploadedFile } from './lib/triggers/new-uploaded-file';
import { newWhatsappAccount } from './lib/triggers/new-whatsapp-account';

export const timelinesAi = createPiece({
  displayName: 'Timelines-ai',
  auth: timelinesAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/timelines-ai.png',
  authors: ['LuizDMM'],
  actions: [
    // Write Actions
    sendMessageToExistingChat,
    sendUploadedFileToExistingChat,
    sendFileToExistingChat,
    sendMessageToNewChat,
    closeChat,
    // Search Actions
    findChat,
    findMessage,
    findUploadedFile,
    findMessageStatus,
    findWhatsappAccount,
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: () => timelinesAiCommon.baseUrl,
      auth: timelinesAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as string}`,
      }),
    }),
  ],
  triggers: [
    chatClosed,
    newOutgoingChat,
    newIncomingChat,
    newSentMessage,
    newReceivedMessage,
    newUploadedFile,
    chatRenamed, // TODO
    newWhatsappAccount,
  ],
});
