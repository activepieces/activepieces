
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { timelinesaiAuth } from './lib/common/auth';
import { sendMessageToExistingChat } from './lib/actions/send-message-to-existing-chat';
import { sendFileToExistingChat } from './lib/actions/send-file-to-existing-chat';
import { sendUploadedFileToExistingChat } from './lib/actions/send-uploaded-file-to-existing-chat';
import { sendMessageToNewChat } from './lib/actions/send-message-to-new-chat';
import { closeChat } from './lib/actions/close-chat';
import { findChat } from './lib/actions/find-chat';
import { findMessage } from './lib/actions/find-message';
import { findUploadedFile } from './lib/actions/find-uploaded-file';
import { findMessageStatus } from './lib/actions/find-message-status';
import { findWhatsAppAccount } from './lib/actions/find-whatsapp-account';
import { newIncomingChat } from './lib/triggers/new-incoming-chat';
import { newOutgoingChat } from './lib/triggers/new-outgoing-chat';
import { chatClosed } from './lib/triggers/chat-closed';
import { newSentMessage } from './lib/triggers/new-sent-message';
import { newReceivedMessage } from './lib/triggers/new-received-message';
import { newUploadedFile } from './lib/triggers/new-uploaded-file';
import { chatRenamed } from './lib/triggers/chat-renamed';
import { newWhatsAppAccount } from './lib/triggers/new-whatsapp-account';

export const timelinesai = createPiece({
  displayName: 'TimelinesAI',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/timelinesai.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['your-username'],
  auth: timelinesaiAuth,
  actions: [
    sendMessageToExistingChat,
    sendFileToExistingChat,
    sendUploadedFileToExistingChat,
    sendMessageToNewChat,
    closeChat,
    findChat,
    findMessage,
    findUploadedFile,
    findMessageStatus,
    findWhatsAppAccount,
    createCustomApiCallAction({
      baseUrl: () => 'https://app.timelines.ai/integrations/api',
      auth: timelinesaiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as any).api_key}`,
      }),
    }),
  ],
  triggers: [
    newIncomingChat,
    newOutgoingChat,
    chatClosed,
    newSentMessage,
    newReceivedMessage,
    newUploadedFile,
    chatRenamed,
    newWhatsAppAccount,
  ],
});
    