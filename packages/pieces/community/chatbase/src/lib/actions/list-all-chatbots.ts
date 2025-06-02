import { createAction, Property } from '@activepieces/pieces-framework';
import { chatbaseAuth } from '../../index';
import { chatbaseRequest, Chatbot } from '../common/chatbase-api';

export const listAllChatbots = createAction({
  auth: chatbaseAuth,
  name: 'listAllChatbots',
  displayName: 'List All Chatbots',
  description: 'Retrieves a list of all chatbots associated with your API key',
  props: {},
  async run({ auth }) {
    const data = await chatbaseRequest<Chatbot[]>(auth, '/get-chatbots', {
      method: 'GET',
    });

    return {
      chatbots: data,
    };
  },
});
