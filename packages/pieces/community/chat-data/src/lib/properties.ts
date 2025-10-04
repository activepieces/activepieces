import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../index';
import { chatDataCommon } from './common';

export const chatbotIdProperty = Property.Dropdown({
  displayName: 'Chatbot',
  description: 'Select a chatbot from your account',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Chat Data account first',
        options: [],
      };
    }

    try {
      const response = await chatDataCommon.makeRequest({
        apiKey: auth as string,
        method: HttpMethod.GET,
        endpoint: '/get-chatbots',
      });

      if (response.status === 'success' && response.chatbots) {
        const options = response.chatbots.map((chatbot: any) => ({
          label: chatbot.chatbotName || chatbot.chatbotId,
          value: chatbot.chatbotId,
        }));

        return {
          disabled: false,
          options,
        };
      }

      return {
        disabled: true,
        placeholder: 'No chatbots found',
        options: [],
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load chatbots. Please check your API key.',
        options: [],
      };
    }
  },
});