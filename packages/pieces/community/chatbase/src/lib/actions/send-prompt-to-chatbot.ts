import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../auth';
import { chatbaseCommon } from '../common';
import { chatbotIdDropdown } from '../common/props';

export const sendPromptToChatbotAction = createAction({
	auth: chatbaseAuth,
	name: 'message_chatbot',
	classification: 'READ',
	displayName: 'Send Prompt to Chatbot',
	description: 'Sends a prompt to a chatbot and returns its reply.',
	audience: 'both',
	aiMetadata: { description: 'Sends a user prompt to a specific Chatbase chatbot (selected by its ID) and returns the generated reply, optionally overriding the model and temperature. Use when an agent needs an answer from a trained chatbot; pass a stable conversationId to keep messages threaded in one logged conversation. Not idempotent: each call appends a turn and produces a fresh, possibly different completion.', idempotent: false },
	propertyGroups: [
		{
			key: 'destination',
			display: 'section',
			label: 'Send To',
			icon: 'send',
			props: ['chatbotId'],
		},
		{
			key: 'message',
			display: 'section',
			label: 'Message',
			icon: 'text',
			props: ['message', 'conversationId'],
		},
		{
			key: 'settings',
			display: 'section',
			label: 'Settings',
			icon: 'sliders',
			props: ['temperature'],
		},
	],
	props: {
		chatbotId: chatbotIdDropdown,
		message: Property.LongText({
			displayName: 'Prompt',
			placeholder: 'What are your opening hours?',
			required: true,
		}),
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'Same ID keeps messages in one saved conversation. Empty: not saved.',
			placeholder: 'customer-1042',
			required: false,
		}),
		temperature: Property.Number({
			displayName: 'Temperature',
			description: '0 gives consistent answers, 1 the most varied.',
			required: false,
			defaultValue: 0,
		}),
		model: Property.StaticDropdown({
			displayName: 'Model',
			description: "Empty uses the chatbot's own model.",
			required: false,
			advanced: true,
			options: {
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'gpt-oss-120b', value: 'gpt-oss-120b' },
					{ label: 'gpt-oss-20b', value: 'gpt-oss-20b' },
					{ label: 'gpt-5.2', value: 'gpt-5.2' },
					{ label: 'gpt-5.5', value: 'gpt-5.5' },
					{ label: 'gpt-5.6-terra', value: 'gpt-5.6-terra' },
					{ label: 'gpt-6-luna', value: 'gpt-6-luna' },
					{ label: 'gpt-6.1-sol', value: 'gpt-6.1-sol' },
					{ label: 'gpt-6.1-terra', value: 'gpt-6.1-terra' },
					{ label: 'claude-opus-5-5', value: 'claude-opus-5-5' },
					{ label: 'claude-sonnet-5-5', value: 'claude-sonnet-5-5' },
					{ label: 'claude-haiku-5-5', value: 'claude-haiku-5-5' },
					{ label: 'gemini-2.5-pro', value: 'gemini-2.5-pro' },
					{ label: 'gemini-3-flash', value: 'gemini-3-flash' },
					{ label: 'gemini-3.1-flash-lite', value: 'gemini-3.1-flash-lite' },
					{ label: 'gemini-3.1-pro', value: 'gemini-3.1-pro' },
					{ label: 'gemini-3.5-flash-lite', value: 'gemini-3.5-flash-lite' },
					{ label: 'gemini-3.6-flash', value: 'gemini-3.6-flash' },
					{ label: 'gemini-3.8-flash', value: 'gemini-3.8-flash' },
					{ label: 'grok-4.7', value: 'grok-4.7' },
					{ label: 'DeepSeek-V3.1', value: 'DeepSeek-V3.1' },
					{ label: 'DeepSeek-R1', value: 'DeepSeek-R1' },
					{ label: 'DeepSeek-V4-Flash', value: 'DeepSeek-V4-Flash' },
					{ label: 'DeepSeek-V4.1-Flash', value: 'DeepSeek-V4.1-Flash' },
					{ label: 'kimi-k2.6', value: 'kimi-k2.6' },
					{ label: 'mistral-medium-3.5', value: 'mistral-medium-3.5' },
					{ label: 'mistral-small-2603', value: 'mistral-small-2603' },
					{ label: 'glm-5.2', value: 'glm-5.2' },
					{ label: 'glm-5.3-flash', value: 'glm-5.3-flash' },
				],
			},
		}),
	},

	async run(context) {
		const { chatbotId, message, temperature, model, conversationId } = context.propsValue;

		const apiKey = context.auth.secret_text;

		const payload: ChatPayload = {
			chatbotId,
			messages: [{ content: message, role: 'user' }],
			...(temperature !== undefined ? { temperature } : {}),
			...(conversationId ? { conversationId } : {}),
			...(model ? { model } : {}),
		};

		const response = await chatbaseCommon.makeRequest<unknown>({
			apiKey,
			method: HttpMethod.POST,
			path: '/chat',
			body: payload,
		});

		return response;
	},
});

type ChatPayload = {
	chatbotId: string;
	messages: { content: string; role: 'user' }[];
	temperature?: number;
	conversationId?: string;
	model?: string;
};
