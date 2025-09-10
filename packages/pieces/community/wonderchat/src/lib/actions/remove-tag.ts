import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

export const removeTag = createAction({
  name: 'removeTag',
  displayName: 'Remove Tag',
  description: 'Remove specific tags from a chatlog.',
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
      description: 'List of tags to remove',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth;
    const { chatlogId, tags } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/delete-tags-from-chatlog',
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
