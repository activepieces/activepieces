
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createMemory } from './lib/actions/memory/create-memory';
import { createMessage } from './lib/actions/messaging/create-message';
import { createChatGPTInstruction } from './lib/actions/ai_interaction/create-chatgpt-instruction';
import { createCustomTraining } from './lib/actions/ai_interaction/create-custom-training';
import { getConversation } from './lib/actions/messaging/get-conversation';
import { uploadDocument } from './lib/actions/documents/upload-document';
import { uploadFile } from './lib/actions/documents/upload-file';
import { uploadUrl } from './lib/actions/documents/upload-url';
import { updateDocument } from './lib/actions/documents/update-document';
import { getDocument } from './lib/actions/documents/get-document';

export const BASE_URL = 'https://api.personal.ai';

export const personalAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key for authentication',
  required: true,
})

export const aiAssistant = createPiece({
  displayName: 'Personal AI',
  description: 'Manage memory storage, messaging, and documents through AI integration.',
  logoUrl: 'https://cdn.activepieces.com/pieces/personal-ai.png',
  auth: personalAiAuth,
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.20.0',
  authors: ['reemayoush'],
  actions: [
    createMemory,
    createMessage,
    createChatGPTInstruction,
    createCustomTraining,
    getConversation,
    uploadDocument,
    uploadFile,
    uploadUrl,
    updateDocument,
    getDocument,
  ],
  triggers: [],
});
