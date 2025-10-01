import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createChatbot,
  deleteChatbot,
  sendMessage,
  updateChatbotSettings,
  retrainChatbot,
  uploadFile
} from './lib/actions';

const markdownDescription = `
    To obtain your Chat Data API key:
    
    1. Go to your [Chat Data account page](https://chat-data.com/account)
    2. Navigate to the API Keys section
    3. Generate a new API key or copy an existing one
    
    **Important:** Keep your API key confidential and do not put it in client-side code. API interactions should be done server-side only.
    `;

export const chatDataAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true
});

export const chatData = createPiece({
  displayName: 'Chat-data',
  auth: chatDataAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/chat-data.png',
  authors: [],
  actions: [
    createChatbot,
    deleteChatbot,
    sendMessage,
    updateChatbotSettings,
    retrainChatbot,
    uploadFile
  ],
  triggers: []
});
