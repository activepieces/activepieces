import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { conversationIdDropdown, teammateIdDropdown } from '../common/dropdown';

export const assignUnassignConversation = createAction({
  auth: frontAuth,
  name: 'assignUnassignConversation',
  displayName: 'Assign/Unassign Conversation',
  description: 'Assign a conversation to a teammate or remove assignment.',
  props: {
    conversation_id: conversationIdDropdown,
    assignee_id: teammateIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { conversation_id, assignee_id } = propsValue;
    const path = `/conversations/${conversation_id}/assignee`;
    const body: Record<string, unknown> = {};
    if (assignee_id) {
      body['assignee_id'] = assignee_id;
    }

    await makeRequest(auth, HttpMethod.PUT, path, body);
    return {
      success: true,
      message: `Conversation ${conversation_id} assignee changed successfully`,
    };
  },
});
