import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChatbotAction } from './lib/actions/create-chatbot';
import { listChatbotsAction } from './lib/actions/list-all-chatbots';
import { searchConversationsAction } from './lib/actions/search-conversations-by-query';
import { sendPromptToChatbotAction } from './lib/actions/send-prompt-to-chatbot';

const markdownDescription = `You can get your API key from your [Chatbase Account](https://www.chatbase.co/dashboard).`;

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
	actions: [
		createChatbotAction,
		sendPromptToChatbotAction,
		searchConversationsAction,
		listChatbotsAction,
		createCustomApiCallAction({
			auth: chatbaseAuth,
			baseUrl: () => 'https://www.chatbase.co/api/v1',
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [],
});
