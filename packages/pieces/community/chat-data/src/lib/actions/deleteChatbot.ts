import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';

export const deleteChatbot = createAction({
  name: 'delete_chatbot',
  displayName: 'Delete Chatbot',
  description:
    'Delete a chatbot and all its associated data (training data, conversations, leads, etc.). This action is irreversible.',
  props: {
    chatbotId: Property.Dropdown({
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
          const client = new ChatDataClient(auth as string);
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
    const client = new ChatDataClient(context.auth as string);
    const result = await client.deleteChatbot(context.propsValue.chatbotId);
    return result;
  },
});
