import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

export const addTag = createAction({
  name: 'addTag',
  displayName: 'Add Tag',
  description: 'Add custom tags to a specific chatlog.',
  auth: wonderchatAuth,
  props: {
    chatlogId: Property.ShortText({
      displayName: 'Chatlog Id',
      description:
        'The ID of your chat session (can be found under Chatlog Details section, labeled as "ID")',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'List of URLs to add to your chatbot',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { chatlogId, tags } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/add-tags-to-chatlog',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiKey,
        chatlogId,
        tags,
      },
    });
    return response.body;
  },
});