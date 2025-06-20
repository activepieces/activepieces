import { createPiece } from '@activepieces/pieces-framework';
import { promptxAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { talkToAgent } from './lib/actions/talk-to-agent';
import { fetchConversationsAction } from './lib/actions/fetch-conversations';
import { createConversationAction } from './lib/actions/create-conversation';

export const promptxAgent = createPiece({
  displayName: 'PromptX Agent',
  description: 'Interact and talk to your agents created in AgentX',
  auth: promptxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/agent.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['rupalbarman'],
  actions: [talkToAgent, fetchConversationsAction, createConversationAction],
  triggers: [],
});
