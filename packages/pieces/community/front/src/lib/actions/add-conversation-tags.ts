import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const addConversationTags = createAction({
  auth: frontAuth,
  name: 'add_conversation_tags',
  displayName: 'Add Conversation Tags',
  description: 'Add one or more tags to a conversation by ID.',
  props: {
    conversation_id: frontProps.conversation(),
    tag_ids: frontProps.tags({
      displayName: 'Tags to Add',
      description: 'Select one or more tags to add to the conversation.',
      required: true,
    }),
  },
  async run(context) {
    const { conversation_id, tag_ids } = context.propsValue;
    const token = context.auth;
    const body = { tag_ids };

    await makeRequest(
      token,
      HttpMethod.POST,
      `/conversations/${conversation_id}/tags`,
      body
    );

    return { success: true };
  },
});
