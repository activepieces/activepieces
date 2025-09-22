import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, tagIdsDropdown } from '../common/dropdown';

export const addConversationTags = createAction({
  auth: frontAuth,
  name: 'addConversationTags',
  displayName: 'Add Conversation Tags',
  description: 'Add one or more tags to a conversation.',
  props: {
    conversation_id: conversationIdDropdown,
    tag_ids: tagIdsDropdown,
  },
  async run({ auth, propsValue }) {
    const { conversation_id, tag_ids } = propsValue;
    const path = `/conversations/${conversation_id}/tags`;
    const body = { tag_ids };
    await makeRequest(auth, HttpMethod.POST, path, body);
    return {
      success: true,
      message: `Tags added to conversation ${conversation_id} successfully`,
    };
  },
});
