import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createChatbot } from './lib/actions/createChatbot';
import { deleteChatbot } from './lib/actions/deleteChatbot';
import { sendMessage } from './lib/actions/sendMessage';
import { updateBasePrompt } from './lib/actions/updateBasePrompt';
import { retrainChatbot } from './lib/actions/retrainChatbot';
import { uploadFile } from './lib/actions/uploadFile';

export const chatData = createPiece({
  displayName: 'Chat-data',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Enter your Chat Data API key',
    required: true,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chat-data.png',
  authors: ['sparkybug'],
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
