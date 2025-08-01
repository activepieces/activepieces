import { missiveAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { missiveCommon } from '../common/client';

export const newComment = createTrigger({
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Fires when a comment is added to an existing conversation',
  auth: missiveAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'comment_12345678-abcd-1234-5678-1234567890ab',
    conversation: 'conv_12345678-abcd-1234-5678-1234567890ab',
    content: 'This is a new comment on the conversation',
    author: {
      id: 'user_12345678-abcd-1234-5678-1234567890ab',
      email: 'user@example.com',
      name: 'John Doe'
    },
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00',
    type: 'comment',
    is_task: false,
    mentions: [],
    attachments: []
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${missiveCommon.baseUrl}/hooks`,
      body: {
        type: 'new_comment',
        url: webhookUrl
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status } = await httpClient.sendRequest(request);
    if (status !== 200) {
      throw new Error(`Failed to register webhook. Status: ${status}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${missiveCommon.baseUrl}/hooks`,
      queryParams: {
        url: webhookUrl,
        type: 'new_comment'
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.id) {
      try {
        const commentDetails = await missiveCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/conversations/${payload.conversation}/comments/${payload.id}`,
        });
        
        return [commentDetails.body];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
}); 