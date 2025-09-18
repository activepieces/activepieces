import { createAction } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const removeConversationLinks = createAction({
  auth: frontAuth,
  name: 'remove_conversation_links',
  displayName: 'Remove Conversation Links',
  description: 'Remove one or more external links from a conversation.',
  props: {
    conversation_id: frontProps.conversation(),
    link_ids: frontProps.links({
      displayName: 'Links to Remove',
      description: 'Select one or more links to remove from the conversation.',
      required: true,
    }),
  },
  async run(context) {
    const { conversation_id, link_ids } = context.propsValue;
    const token = context.auth;
    const body = { link_ids };

    await makeRequest(
      token,
      HttpMethod.DELETE,
      `/conversations/${conversation_id}/links`,
      body
    );

    return { success: true };
  },
});
