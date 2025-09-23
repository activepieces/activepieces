import { createPiece } from '@activepieces/pieces-framework';
import { searchKnowledgeBase } from './lib/actions/search-knowledge-base';
import { addToKnowledgeBase } from './lib/actions/add-to-knowledge-base';
import { promptxAuth } from './lib/auth';

export const knowledgeBase = createPiece({
  displayName: 'PromptX Knowledge Base',
  description: 'Search and manage content in PromptX Knowledge Base',
  auth: promptxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://ml.oneweb.tech/public_img_main/images/PromptXAI/PromptXAI_c5008fdcd9a94d61b293c1080ebec834.png',
  authors: ['rupalbarman'],
  actions: [searchKnowledgeBase, addToKnowledgeBase],
  triggers: [],
});
