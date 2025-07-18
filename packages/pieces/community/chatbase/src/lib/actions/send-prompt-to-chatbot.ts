import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { makeRequest } from '../common';
import { chatbotIdDropdown } from '../common/props';

export const sendPromptToChatbotAction = createAction({
	auth: chatbaseAuth,
	name: 'message_chatbot',
	displayName: 'Send Prompt to Chatbot',
	description: 'Sends a prompt to the chatbot to generate a response.',
	props: {
		chatbotId: chatbotIdDropdown,
		message: Property.LongText({
			displayName: 'Prompt',
			required: true,
		}),

		temperature: Property.Number({
			displayName: 'Temperature',
			description: 'Higher values = more random output. Between 0 and 1.',
			required: false,
			defaultValue: 0,
		}),
		conversationId: Property.ShortText({
			displayName: 'Conversation ID',
			description: 'Unique ID for saving this conversation in Chatbase dashboard.',
			required: false,
		}),
		model: Property.StaticDropdown({
			displayName: 'Model (Optional)',
			required: false,
			options: {
				options: [
					{ label: 'o4-mini', value: 'o4-mini' },
					{ label: 'o3', value: 'o3' },
					{ label: 'gpt-4', value: 'gpt-4' },
					{ label: 'gpt-4o', value: 'gpt-4o' },
					{ label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
					{ label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' },
					{ label: 'gpt-4.1-nano', value: 'gpt-4.1-nano' },
					{ label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
					{ label: 'o3-mini', value: 'o3-mini' },
					{ label: 'gpt-4.1', value: 'gpt-4.1' },
					{ label: 'gpt-4.5', value: 'gpt-4.5' },
					{ label: 'claude-sonnet-4', value: 'claude-sonnet-4' },
					{ label: 'claude-3-7-sonnet', value: 'claude-3-7-sonnet' },
					{ label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet' },
					{ label: 'claude-3-opus', value: 'claude-3-opus' },
					{ label: 'claude-opus-4', value: 'claude-opus-4' },
					{ label: 'claude-3-haiku', value: 'claude-3-haiku' },
					{ label: 'gemini-2.0-flash', value: 'gemini-2.0-flash' },
					{ label: 'gemini-1.5-flash', value: 'gemini-1.5-flash' },
					{ label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' },
					{ label: 'gemini-2.0-pro', value: 'gemini-2.0-pro' },
					{ label: 'command-r', value: 'command-r' },
					{ label: 'command-r-plus', value: 'command-r-plus' },
					{ label: 'DeepSeek-V3', value: 'DeepSeek-V3' },
					{ label: 'DeepSeek-R1', value: 'DeepSeek-R1' },
					{
						label: 'Llama-4-Scout-17B-16E-Instruct',
						value: 'Llama-4-Scout-17B-16E-Instruct',
					},
					{
						label: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
						value: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
					},
					{ label: 'grok-3', value: 'grok-3' },
					{ label: 'grok-3-mini', value: 'grok-3-mini' },
				],
			},
		}),
	},

	async run(context) {
		const { chatbotId, message, temperature, model, conversationId } = context.propsValue;

		const apiKey = context.auth as string;

		const payload: Record<string, any> = {
			chatbotId,
			messages: [{ content: message, role: 'user' }],
		};

		if (temperature !== undefined) payload['temperature'] = temperature;
		if (conversationId) payload['conversationId'] = conversationId;
		if (model) payload['model'] = model;

		const response = await makeRequest(apiKey, HttpMethod.POST, '/chat', payload);

		return response;
	},
});
