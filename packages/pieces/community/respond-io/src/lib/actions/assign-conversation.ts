import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const assignConversation = createAction({
  auth: respondIoAuth,
  name: 'assignConversation',
  displayName: 'Assign or Unassign Conversation',
  description: 'Change the assignee on a conversation',
  props: {
    conversationId: commonProps.conversationId,
    assigneeId: commonProps.assigneeId,
    unassign: Property.Checkbox({
      displayName: 'Unassign',
      description: 'Check to unassign the conversation (leave assignee empty)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { conversationId, assigneeId, unassign } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    const body = unassign ? { assigneeId: null } : { assigneeId };

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/workspaces/${workspaceId}/conversations/${conversationId}/assign`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
}); 