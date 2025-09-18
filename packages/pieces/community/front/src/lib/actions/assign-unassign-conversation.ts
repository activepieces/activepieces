import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const assignUnassignConversation = createAction({
  auth: frontAuth,
  name: 'assignUnassignConversation',
  displayName: 'Assign/Unassign Conversation',
  description: 'Assign a conversation to a teammate or remove assignment.',
  props: {
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to assign or unassign.',
      required: true,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The ID of the teammate to assign the conversation to. Leave empty to unassign.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { conversation_id, assignee_id } = propsValue;
    const path = `/conversations/${conversation_id}/assignee`;
    const body: Record<string, unknown> = {};
    if (assignee_id) {
      body['assignee_id'] = assignee_id;
    }

    return await makeRequest(auth.access_token, HttpMethod.PATCH, path, body);
  },
});