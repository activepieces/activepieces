import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addConversationTags = createAction({
  auth: frontAuth,
  name: 'addConversationTags',
  displayName: 'Add Conversation Tags',
  description: 'Add one or more tags to a conversation.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to tag.',
      required: true,
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'List of tag IDs to add to the conversation.',
      required: true,
      properties: {
        item: Property.ShortText({ displayName: 'Tag ID', required: true }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, tag_ids } = propsValue;
    const path = `/conversations/${conversation_id}/tags`;
    const body = { tag_ids };
    return await makeRequest(auth.access_token, HttpMethod.POST, path, body);
  },
});
