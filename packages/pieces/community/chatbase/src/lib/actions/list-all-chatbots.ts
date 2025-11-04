import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { makeRequest } from '../common';

export const listChatbotsAction = createAction({
	auth: chatbaseAuth,
	name: 'list_chatbots',
	displayName: 'List All Chatbots',
	description: 'Retrieves a list of all chatbots.',
	props: {},

	async run(context) {
		const apiKey = context.auth as string;

		const response = await makeRequest(apiKey, HttpMethod.GET, '/get-chatbots');

		return response;
	},
});
