import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const removeConversationTags = createAction({
  auth: frontAuth,
  name: 'remove_conversation_tags',
  displayName: 'Remove Conversation Tags',
  description: 'Remove one or more tags from a conversation.',
  props: {
    conversation_id: frontProps.conversation(),
    tag_ids: frontProps.tags({
      displayName: 'Tags to Remove',
      description: 'Select one or more tags to remove from the conversation.',
      required: true,
    }),
  },
  async run(context) {
    const { conversation_id, tag_ids } = context.propsValue;
    const token = context.auth;
    const body = { tag_ids };

    await makeRequest(
      token,
      HttpMethod.DELETE,
      `/conversations/${conversation_id}/tags`,
      body
    );

    return { success: true };
  },
});
