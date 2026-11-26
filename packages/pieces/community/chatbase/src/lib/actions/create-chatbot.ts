import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../auth';
import { chatbaseCommon } from '../common';

export const createChatbotAction = createAction({
	auth: chatbaseAuth,
	name: 'create_chatbot',
	classification: 'WRITE',
	displayName: 'Create Chatbot',
	description: 'Creates a new chatbot, optionally trained on text you paste.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new Chatbase chatbot, optionally seeding it with inline training text. Use when an agent needs to provision a fresh chatbot before sending prompts to it. Not idempotent: each call creates a separate chatbot even with identical input.', idempotent: false },
	propertyGroups: [
		{
			key: 'details',
			display: 'section',
			label: 'New Chatbot',
			icon: 'user',
			props: ['chatbotName'],
		},
		{
			key: 'training',
			display: 'section',
			label: 'Training Data',
			icon: 'text',
			props: ['sourceText'],
		},
	],
	props: {
		chatbotName: Property.ShortText({
			displayName: 'Chatbot Name',
			description: 'At least 3 characters.',
			placeholder: 'Customer Support Bot',
			required: true,
		}),
		sourceText: Property.LongText({
			displayName: 'Source Text',
			description: 'Text the chatbot learns from. Add more sources in Chatbase later.',
			placeholder: 'Paste FAQs, policies or product details…',
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

		const response = await chatbaseCommon.makeRequest<unknown>({
			apiKey,
			method: HttpMethod.POST,
			path: '/create-chatbot',
			body,
		});

		return response;
	},
});
