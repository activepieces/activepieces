import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const openConversation = createAction({
  auth: respondIoAuth,
  name: 'openConversation',
  displayName: 'Open Conversation',
  description: 'Mark a conversation as open',
  props: {
    conversationId: commonProps.conversationId,
  },
  async run(context) {
    const { conversationId } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/workspaces/${workspaceId}/conversations/${conversationId}/status`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        status: 'open',
      },
    });

    return response.body;
  },
}); 