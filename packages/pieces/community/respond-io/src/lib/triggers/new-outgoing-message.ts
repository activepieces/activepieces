import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const newOutgoingMessageTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_outgoing_message',
  displayName: 'New Outgoing Message',
  description: 'Triggers when a message is sent from Respond.io',
  props: {
    channelFilter: Property.Array({
      displayName: 'Channel Filter',
      description: 'Filter messages by specific channels (leave empty for all channels)',
      required: false,
      properties: {
        channelId: Property.ShortText({
          displayName: 'Channel ID',
          required: true
        })
      }
    })
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      // Create webhook for outgoing messages
      const webhookData = {
        url: context.webhookUrl,
        events: ['message.sent'],
        name: 'Activepieces - New Outgoing Message',
        description: 'Webhook for new outgoing messages',
        filters: context.propsValue.channelFilter && context.propsValue.channelFilter.length > 0
          ? {
              channels: context.propsValue.channelFilter.map(filter => filter.channelId)
            }
          : undefined
      };

      const response = await client.makeRequest(HttpMethod.POST, '/webhook', undefined, webhookData);
      
      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        webhookId: response.id,
        webhookUrl: context.webhookUrl
      });

      console.log('Webhook created for new outgoing messages:', response);
    } catch (error) {
      console.error('Failed to create webhook for new outgoing messages:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for new outgoing messages');
      }
    } catch (error) {
      console.error('Failed to delete webhook for new outgoing messages:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is an outgoing message event
    if (payload.event !== 'message.sent' || payload.data?.direction !== 'outgoing') {
      return [];
    }

    const message = payload.data;
    
    return [
      {
        id: message.id,
        conversationId: message.conversationId,
        contactId: message.contactId,
        channelId: message.channelId,
        content: message.content,
        type: message.type,
        direction: message.direction,
        sentBy: message.sentBy,
        createdAt: message.createdAt,
        contact: payload.data.contact || {},
        conversation: payload.data.conversation || {},
        channel: payload.data.channel || {},
        rawPayload: payload
      }
    ];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  },
  sampleData: {
    id: 'msg_987654321',
    conversationId: 'conv_123456789',
    contactId: 'contact_123456789',
    channelId: 'channel_123456789',
    content: 'Thank you for contacting us. How can I help you today?',
    type: 'text',
    direction: 'outgoing',
    sentBy: 'user_123456789',
    createdAt: '2024-01-01T12:05:00Z',
    contact: {
      id: 'contact_123456789',
      phone: '+1234567890',
      firstName: 'John',
      lastName: 'Doe'
    },
    conversation: {
      id: 'conv_123456789',
      status: 'open'
    },
    channel: {
      id: 'channel_123456789',
      name: 'WhatsApp Business',
      type: 'whatsapp'
    }
  }
});
