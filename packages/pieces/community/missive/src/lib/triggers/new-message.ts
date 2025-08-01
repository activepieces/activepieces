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

export const newMessage = createTrigger({
  name: 'new_message',
  displayName: 'New Message',
  description: 'Fires when a new message (email, SMS, chat) is received',
  auth: missiveAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 'msg_12345678-abcd-1234-5678-1234567890ab',
    conversation: 'conv_12345678-abcd-1234-5678-1234567890ab',
    subject: 'New Email Subject',
    content: 'This is the content of the new message',
    from: {
      email: 'sender@example.com',
      name: 'John Doe'
    },
    to: [
      {
        email: 'recipient@example.com',
        name: 'Jane Smith'
      }
    ],
    cc: [],
    bcc: [],
    account: 'acc_12345678-abcd-1234-5678-1234567890ab',
    account_type: 'email',
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00',
    type: 'incoming',
    status: 'received',
    references: [],
    attachments: []
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${missiveCommon.baseUrl}/hooks`,
      body: {
        type: 'incoming_email',
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
        type: 'incoming_email'
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
        const messageDetails = await missiveCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/messages/${payload.id}`,
        });
        
        return [messageDetails.body];
      } catch (error) {
        return [payload];
      }
    }
    
    return [payload];
  },
}); 