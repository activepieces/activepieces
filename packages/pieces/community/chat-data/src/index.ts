import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createChatbot } from './lib/actions/createChatbot';
import { deleteChatbot } from './lib/actions/deleteChatbot';
import { sendMessage } from './lib/actions/sendMessage';
import { updateBasePrompt } from './lib/actions/updateBasePrompt';
import { retrainChatbot } from './lib/actions/retrainChatbot';
import { uploadFile } from './lib/actions/uploadFile';
import { chatDataAuth } from './lib/common/types';

export const chatData = createPiece({
  displayName: 'Chat Data',
  description: 'Build AI-chatbots with support for live chat escalation, knowledge bases, or custom backend endpoints.',
  auth:chatDataAuth ,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chat-data.png',
  authors: ['sparkybug', 'onyedikachi-david'],
  actions: [
    createChatbot,
    deleteChatbot,
    sendMessage,
    updateBasePrompt,
    retrainChatbot,
    uploadFile,
  ],
  triggers: [],
});
