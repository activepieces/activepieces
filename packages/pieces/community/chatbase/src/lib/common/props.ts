import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './index';

export const chatbotIdDropdown = Property.Dropdown({
	displayName: 'Chatbot',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				placeholder: 'Please connect your account first.',
				options: [],
			};
		}

		const apiKey = auth as string;
		const response = await makeRequest(apiKey, HttpMethod.GET, '/get-chatbots');

		const options: DropdownOption<string>[] = response.chatbots.map((chatbot: any) => ({
			label: chatbot.chatbotName,
			value: chatbot.chatbotId,
		}));

		return {
			disabled: false,
			options,
		};
	},
});
