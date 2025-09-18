import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationDropdown, tagsMultiSelectDropdown } from '../common/props';

export const removeConversationTags = createAction({
  auth: frontAuth,
  name: 'remove_conversation_tags',
  displayName: 'Remove Conversation Tags',
  description: 'Remove one or more tags from a conversation.',
  props: {
    conversation_id: conversationDropdown,
    tag_ids: tagsMultiSelectDropdown(),
  },
  async run(context) {
    const { conversation_id, tag_ids } = context.propsValue;
    const token = context.auth;

    // The Front API requires a body even for this DELETE request
    await makeRequest(
      token,
      HttpMethod.DELETE,
      `/conversations/${conversation_id}/tags`,
      {
        tag_ids: tag_ids,
      }
    );

    return { success: true };
  },
});