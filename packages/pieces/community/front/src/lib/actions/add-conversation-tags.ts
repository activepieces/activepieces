import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, tagsMultiSelectDropdown } from '../common/props';

export const addConversationTags = createAction({
  auth: frontAuth,
  name: 'add_conversation_tags',
  displayName: 'Add Conversation Tags',
  description: 'Add one or more tags to a conversation by ID.',
  props: {
    conversation_id: conversationDropdown,
    tag_ids: tagsMultiSelectDropdown(),
  },
  async run(context) {
    const { conversation_id, tag_ids } = context.propsValue;
    const token = context.auth;

    await makeRequest(
        token,
        HttpMethod.POST,
        `/conversations/${conversation_id}/tags`,
        {
            tag_ids: tag_ids,
        }
    );

    return { success: true };
  },
});