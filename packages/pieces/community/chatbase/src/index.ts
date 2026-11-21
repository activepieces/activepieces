import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createChatbotAction } from './lib/actions/create-chatbot';
import { listChatbotsAction } from './lib/actions/list-all-chatbots';
import { searchConversationsAction } from './lib/actions/search-conversations-by-query';
import { sendPromptToChatbotAction } from './lib/actions/send-prompt-to-chatbot';
import { chatbaseAuth } from './lib/auth';
import { chatbaseCommon } from './lib/common';

export const chatbase = createPiece({
	displayName: 'Chatbase',
	description: 'Build and manage AI chatbots with custom sources.',
	auth: chatbaseAuth,
	minimumSupportedRelease: '0.88.2',
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
			baseUrl: () => chatbaseCommon.baseUrl,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth.secret_text}`,
				};
			},
			props: {
				url: {
					description: `Full URL, or a path relative to ${chatbaseCommon.baseUrl}`,
					placeholder: '/get-chatbots',
				},
			},
		}),
	],
	triggers: [],
});
