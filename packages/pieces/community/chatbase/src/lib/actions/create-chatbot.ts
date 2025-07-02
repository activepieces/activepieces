import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { makeRequest } from '../common';

export const createChatbotAction = createAction({
	auth: chatbaseAuth,
	name: 'create_chatbot',
	displayName: 'Create Chatbot',
	description: 'Creates a new chatbot.',
	props: {
		chatbotName: Property.ShortText({
			displayName: 'Chatbot Name',
			required: true,
		}),
		sourceText: Property.LongText({
			displayName: 'Source Text',
			description: 'Optional text data for training the chatbot.',
			required: false,
		}),
	},
	async run(context) {
		const { chatbotName, sourceText } = context.propsValue;
		const apiKey = context.auth as string;

		const body: Record<string, unknown> = {
			chatbotName,
		};

		if (sourceText) {
			body['sourceText'] = sourceText;
		}

		const response = await makeRequest(apiKey, HttpMethod.POST, '/create-chatbot', body);

		return response;
	},
});
