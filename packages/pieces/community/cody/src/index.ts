import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createDocumentFromTextAction } from './lib/actions/create-document-from-text';
import { uploadFileToKnowledgeBaseAction } from './lib/actions/upload-file-to-knowledge-base';
import { sendMessageAction } from './lib/actions/send-message';
import { createConversationAction } from './lib/actions/create-conversation';
import { findBotAction } from './lib/actions/find-bot';
import { findConversationAction } from './lib/actions/find-conversation';

export const codyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Get your API key from https://meetcody.ai/account/api',
});

export const cody = createPiece({
  displayName: 'Cody',
  description: 'AI model framework that generates responses from bots, ingests knowledge base documents, and continues conversations',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cody.png',
  authors: ['sudarshan-magar7'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: codyAuth,
  actions: [
    createDocumentFromTextAction,
    uploadFileToKnowledgeBaseAction,
    sendMessageAction,
    createConversationAction,
    findBotAction,
    findConversationAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.meetcody.ai/v1',
      auth: codyAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      }),
    }),
  ],
  triggers: [],
});
    