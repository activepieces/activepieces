import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown } from '../common/dropdown';

export const deleteChatbot = createAction({
  auth: ChatDataAuth,
  name: 'deleteChatbot',
  displayName: 'Delete Chatbot',
  description: 'Delete a chatbot from Chat Data',
  props: {
    chatbotId: chatbotIdDropdown,
  },
  async run(context) {
    const chatbotId = context.propsValue.chatbotId as string;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.DELETE,
      `/delete-chatbot/${chatbotId}`
    );

    return response;
  },
});