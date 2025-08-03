import { googleChatApiAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newMessage = createTrigger({
  auth: googleChatApiAuth,
  name: 'new-message',
  displayName: 'New Message',
  description: 'Fires when a new message is received in Google Chat',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to monitor for new messages',
      required: true,
    }),
    includeBotMessages: Property.Checkbox({
      displayName: 'Include Bot Messages',
      description: 'Whether to include messages from bots',
      required: false,
      defaultValue: false,
    }),
  },
  type: 'webhook',
  onEnable: async ({ auth, propsValue, webhookUrl }) => {
    const { spaceId, includeBotMessages } = propsValue;

    // Register webhook with Google Chat API
    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/webhooks`;

    const webhookData = {
      webhookUrl,
      events: ['message.created'],
      includeBotMessages: includeBotMessages || false,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const webhookInfo = await response.json();
    return {
      webhookId: webhookInfo.name,
    };
  },
  onDisable: async ({ auth, webhookId }) => {
    if (!webhookId) return;

    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/${webhookId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unregister webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }
  },
  run: async ({ payload }) => {
    return payload;
  },
}); 