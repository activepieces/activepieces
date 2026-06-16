import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../auth';
import { makeRequest } from '../common';

export const listChatbotsAction = createAction({
	auth: chatbaseAuth,
	name: 'list_chatbots',
	displayName: 'List All Chatbots',
	description: 'Retrieves a list of all chatbots.',
	audience: 'both',
	aiMetadata: { description: 'Lists all chatbots in the authenticated Chatbase account. Use when an agent needs to discover available chatbots or resolve a chatbot ID before sending prompts or searching conversations. Takes no input; idempotent read-only listing.', idempotent: true },
	props: {},

	async run(context) {
		const apiKey = context.auth.secret_text;

		const response = await makeRequest(apiKey, HttpMethod.GET, '/get-chatbots');

		return response;
	},
});
