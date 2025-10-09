import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, linkidsDropdown } from '../common/dropdown';

export const addConversationLinks = createAction({
  auth: frontAuth,
  name: 'addConversationLinks',
  displayName: 'Add Conversation Links',
  description: 'Link external references (URLs) to a conversation.',
  props: {
    conversation_id: conversationIdDropdown,
    link_ids: linkidsDropdown,
  },
  async run({ auth, propsValue }) {
    const { conversation_id, link_ids } = propsValue;
    const path = `/conversations/${conversation_id}/links`;
    const body = { link_ids };
    await makeRequest(auth, HttpMethod.POST, path, body);
    return {
      success: true,
      message: `Links added to conversation ${conversation_id} successfully`,
    };
  },
});
