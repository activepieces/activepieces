import { googleChatApiAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newMention = createTrigger({
  auth: googleChatApiAuth,
  name: 'new-mention',
  displayName: 'New Mention',
  description: 'Fires when a new mention is received in a space',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to monitor for mentions',
      required: true,
    }),
    mentionType: Property.StaticDropdown({
      displayName: 'Mention Type',
      description: 'Type of mentions to monitor',
      required: false,
      options: {
        options: [
          { label: 'All Mentions', value: 'all' },
          { label: 'User Mentions Only', value: 'user' },
          { label: 'Bot Mentions Only', value: 'bot' },
        ],
      },
    }),
  },
  type: 'webhook',
  onEnable: async ({ auth, propsValue, webhookUrl }) => {
    const { spaceId, mentionType } = propsValue;

    // Register webhook with Google Chat API
    const baseUrl = 'https://chat.googleapis.com/v1';
    const endpoint = `${baseUrl}/spaces/${spaceId}/webhooks`;

    const webhookData = {
      webhookUrl,
      events: ['message.created'],
      filters: {
        mentionType: mentionType || 'all',
      },
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