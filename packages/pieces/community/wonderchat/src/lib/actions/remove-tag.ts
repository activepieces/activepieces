import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

export const removeTag = createAction({
  name: 'removeTag',
  displayName: 'Remove Tag',
  description: 'Remove specific tags from a chatlog.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes one or more tags from a specific Wonderchat chatlog (chat session identified by chatlogId). Use to clear or correct labels on a conversation. Idempotent: re-running with the same tags leaves the chatlog’s tag set unchanged once those tags are already absent.',
    idempotent: true,
  },
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
    const apiKey = auth.secret_text;
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
