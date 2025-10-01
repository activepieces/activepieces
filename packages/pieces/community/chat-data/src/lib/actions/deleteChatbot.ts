import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';

export const deleteChatbot = createAction({
  name: 'delete_chatbot',
  displayName: 'Delete Chatbot',
  description: 'Delete a chatbot',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'ID of the chatbot to delete',
      required: true,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);
    await client.deleteChatbot(context.propsValue.chatbotId);
    return { success: true };
  },
});