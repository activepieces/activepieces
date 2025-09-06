import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

export const addPage = createAction({
  name: 'addPage',
  displayName: 'Add Page',
  description: 'Add new pages to your chatbot’s knowledge base.',
  auth: wonderchatAuth,
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot Id',
      description: 'The ID of the chatbot you want to chat with.',
      required: true,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'List of URLs to add to your chatbot',
      required: false,
    }),
    sessionCookie: Property.LongText({
      displayName: 'Session cookie',
      description: 'Session cookie for crawling sites behind login',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { chatbotId, urls, sessionCookie } = propsValue

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/add-pages',
      headers: { 'Content-Type': 'application/json'},
      body: {
        apiKey,
        chatbotId,
        urls,
        sessionCookie,
      },
    });
    return response.body;
  },
});
