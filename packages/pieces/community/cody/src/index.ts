
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { codyAuth } from './lib/common/auth';
import { createConversationAction } from './lib/actions/create-conversation';
import { createDocumentFromTextAction } from './lib/actions/create-document-from-text';
import { findBotAction } from './lib/actions/find-bot';
import { findConversationAction } from './lib/actions/find-conversation';
import { sendMessageAction } from './lib/actions/send-message';
import { uploadFileToKnowledgeBaseAction } from './lib/actions/upload-file-to-knowledge-base';

export const cody = createPiece({
  displayName: 'Cody',
  description: 'AI model framework that generates responses from bots, ingests knowledge base documents, and continues conversations.',
  auth: codyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cody.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['ActivePieces Team'],
  actions: [
    createDocumentFromTextAction,
    uploadFileToKnowledgeBaseAction,
    sendMessageAction,
    createConversationAction,
    findBotAction,
    findConversationAction,
    createCustomApiCallAction({
      auth: codyAuth,
      baseUrl: () => 'https://getcody.ai/api/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});