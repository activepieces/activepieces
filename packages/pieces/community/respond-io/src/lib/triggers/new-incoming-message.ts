import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const newIncomingMessageTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_incoming_message',
  displayName: 'New Incoming Message',
  description: 'Triggers when a new message is received from a contact',
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
      // Create webhook for incoming messages
      const webhookData = {
        url: context.webhookUrl,
        events: ['message.received'],
        name: 'Activepieces - New Incoming Message',
        description: 'Webhook for new incoming messages',
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

      console.log('Webhook created for new incoming messages:', response);
    } catch (error) {
      console.error('Failed to create webhook for new incoming messages:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for new incoming messages');
      }
    } catch (error) {
      console.error('Failed to delete webhook for new incoming messages:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is an incoming message event
    if (payload.event !== 'message.received' || payload.data?.direction !== 'incoming') {
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
    id: 'msg_123456789',
    conversationId: 'conv_123456789',
    contactId: 'contact_123456789',
    channelId: 'channel_123456789',
    content: 'Hello, I need help with my order',
    type: 'text',
    direction: 'incoming',
    createdAt: '2024-01-01T12:00:00Z',
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
