import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createAgent } from './lib/actions/create-agent';
import { createConversation } from './lib/actions/create-conversation';
import { updateSettings } from './lib/actions/update-settings';
import { sendMessage } from './lib/actions/send-message';
import { findConversation } from './lib/actions/find-conversation';
import { deleteAgent } from './lib/actions/delete-agent';
import { updateAgent } from './lib/actions/update-agent';
import { exportConversation } from './lib/actions/export-conversation';
import { customgptAuth } from './lib/common/auth';
import { newConversation } from './lib/triggers/new-conversation';
import { PieceCategory } from '@activepieces/shared';

export const customgpt = createPiece({
  displayName: 'CustomGPT',
  auth: customgptAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/customgpt.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description:
    'CustomGPT allows you to create and deploy custom AI chatbots tailored to your specific needs.',
  actions: [
    createAgent,
    createConversation,
    deleteAgent,
    exportConversation,
    findConversation,
    sendMessage,
    updateAgent,
    updateSettings,
  ],
  triggers: [newConversation],
});
