import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { chatbaseRequest } from '../common/chatbase-api';

export const createChatbot = createAction({
  auth: chatbaseAuth,
  name: 'createChatbot',
  displayName: 'Create Chatbot',
  description: 'Creates a new chatbot in Chatbase',
  props: {
    name: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'The name of your chatbot',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A brief description of your chatbot',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await chatbaseRequest<{ chatbotId: string }>(auth, '/chatbots', {
      method: 'POST',
      body: JSON.stringify({
        name: propsValue.name,
        description: propsValue.description,
      }),
    });

    return {
      chatbotId: data.chatbotId,
    };
  },
});
