import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property, tryCatch } from '@activepieces/pieces-framework';
import { chatbaseCommon } from './index';
import { chatbaseAuth } from '../auth';

export const chatbotIdDropdown = Property.Dropdown({
	auth: chatbaseAuth,
	displayName: 'Chatbot',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Connect your Chatbase account first.',
				options: [],
			};
		}

		const { data: response, error } = await tryCatch(() =>
			chatbaseCommon.makeRequest<ChatbotsResponse>({
				apiKey: auth.secret_text,
				method: HttpMethod.GET,
				path: '/get-chatbots',
			}),
		);

		if (error || !response) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Could not load chatbots. Check your connection.',
			};
		}

		const chatbots = Array.isArray(response.chatbots) ? response.chatbots : [];
		const options = chatbots.flatMap((chatbot): DropdownOption<string>[] => {
			const value = chatbot.id ?? chatbot.chatbotId;
			if (value === undefined) {
				return [];
			}
			return [{ label: chatbot.name ?? chatbot.chatbotName ?? value, value }];
		});

		if (options.length === 0) {
			return {
				disabled: false,
				options: [],
				placeholder: 'No chatbots found. Create one in Chatbase first.',
			};
		}

		return {
			disabled: false,
			options,
		};
	},
});

type ChatbaseChatbot = {
	id?: string;
	name?: string;
	chatbotId?: string;
	chatbotName?: string;
};

type ChatbotsResponse = {
	chatbots?: ChatbaseChatbot[];
};
