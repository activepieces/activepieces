import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const addConversationLinks = createAction({
  auth: frontAuth,
  name: 'add_conversation_links',
  displayName: 'Add Conversation Links',
  description: 'Link external references (URLs) to a conversation.',
  props: {
    conversation_id: frontProps.conversation(),
    link_ids: frontProps.links({
      displayName: 'Links to Add',
      description: 'Select one or more links to add to the conversation.',
      required: true,
    }),
  },
  async run(context) {
    const { conversation_id, link_ids } = context.propsValue;
    const token = context.auth;
    const body = { link_ids };

    await makeRequest(
      token,
      HttpMethod.POST,
      `/conversations/${conversation_id}/links`,
      body
    );

    return { success: true };
  },
});
