import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const addCommentToConversation = createAction({
  auth: respondIoAuth,
  name: 'addCommentToConversation',
  displayName: 'Add Comment to Conversation',
  description: 'Append an internal note to a conversation',
  props: {
    conversationId: commonProps.conversationId,
    comment: commonProps.comment,
  },
  async run(context) {
    const { conversationId, comment } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/workspaces/${workspaceId}/conversations/${conversationId}/comments`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        content: comment,
      },
    });

    return response.body;
  },
}); 