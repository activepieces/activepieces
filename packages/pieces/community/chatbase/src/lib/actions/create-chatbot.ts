import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../auth';
import { makeRequest } from '../common';

export const createChatbotAction = createAction({
	auth: chatbaseAuth,
	name: 'create_chatbot',
	displayName: 'Create Chatbot',
	description: 'Creates a new chatbot.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new Chatbase chatbot, optionally seeding it with inline training text. Use when an agent needs to provision a fresh chatbot before sending prompts to it. Not idempotent: each call creates a separate chatbot even with identical input.', idempotent: false },
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
		const apiKey = context.auth.secret_text;

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
