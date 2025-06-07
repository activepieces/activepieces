import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChatbotAction } from './lib/actions/create-chatbot';
import { sendPromptToChatbotAction } from './lib/actions/send-prompt-to-chatbot';
import { searchConversationsAction } from './lib/actions/search-conversations-by-query';
import { listChatbotsAction } from './lib/actions/list-all-chatbots';
import { leadSubmittedTrigger } from './lib/triggers/lead-submitted';

const markdownDescription = 'You can get your API key from your [Chatbase Account](https://www.chatbase.co/).';

export const chatbaseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const chatbase = createPiece({
  displayName: 'Chatbase',
  description: 'Build and manage AI chatbots with custom sources.',
  auth: chatbaseAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/chatbase.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['krushnarout'],
  actions: [createChatbotAction, sendPromptToChatbotAction, searchConversationsAction, listChatbotsAction],
  triggers: [leadSubmittedTrigger],
});
