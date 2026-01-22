import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { chatDataAuth } from '../common/types';

export const deleteChatbot = createAction({
  auth: chatDataAuth,
  name: 'delete_chatbot',
  displayName: 'Delete Chatbot',
  description:
    'Delete a chatbot and all its associated data (training data, conversations, leads, etc.). This action is irreversible.',
  props: {
    chatbotId: Property.Dropdown({
      auth: chatDataAuth,
      displayName: 'Chatbot',
      description: 'Select the chatbot to delete',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const client = new ChatDataClient(auth.secret_text);
          const chatbots = await client.listChatbots();
          return {
            options: chatbots.map((chatbot) => ({
              label: chatbot.name,
              value: chatbot.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load chatbots',
          };
        }
      },
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth.secret_text);
    const result = await client.deleteChatbot(context.propsValue.chatbotId);
    return result;
  },
});
