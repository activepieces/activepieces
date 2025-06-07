import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { chatbaseAuth } from '../../index';

export const listChatbotsAction = createAction({
  auth: chatbaseAuth,
  name: 'list_chatbots',
  displayName: 'List All Chatbots',
  description: 'Retrieve a list of all chatbots associated with your API key.',
  props: {},

  async run(context) {
    const apiKey = context.auth as string;

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/get-chatbots'
    );

    return response;
  },
});
