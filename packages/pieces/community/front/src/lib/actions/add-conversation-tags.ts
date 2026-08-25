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
  audience: 'both',
  aiMetadata: {
    description:
      'Apply one or more existing tags (by tag ID) to a Front conversation for categorization or routing. Use to label a thread; tags must already exist. Effectively idempotent: re-applying a tag already present leaves the conversation tag set unchanged.',
    idempotent: true,
  },
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
