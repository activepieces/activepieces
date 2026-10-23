import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { agentxAuth } from './lib/auth';
import { createConversationWithSingleAgentAction } from './lib/actions/create-conversation-with-single-agent';
import { sendMessageToExistingConversationAction } from './lib/actions/send-message-to-existing-conversation';
import { findMessageAction } from './lib/actions/find-message';
import { searchAgentsAction } from './lib/actions/search-agents';
import { findConversationAction } from './lib/actions/find-conversation';
import { newAgentTrigger } from './lib/triggers/new-agent';
import { newConversationTrigger } from './lib/triggers/new-conversation';

export const agentx = createPiece({
  displayName: 'AgentX',
  auth: agentxAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/agentx.png',
  authors: ['Niket2035', 'sanket-a11y'],
  actions: [
    createConversationWithSingleAgentAction,
    sendMessageToExistingConversationAction,
    findMessageAction,
    searchAgentsAction,
    findConversationAction,
  ],
  triggers: [newAgentTrigger, newConversationTrigger],
});
