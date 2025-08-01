import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const conversationClosedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'conversation_closed',
  displayName: 'Conversation Closed',
  description: 'Triggers when a conversation is closed',
  props: {
    channelFilter: Property.Array({
      displayName: 'Channel Filter',
      description: 'Filter conversations by specific channels (leave empty for all channels)',
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
      // Create webhook for conversation closed events
      const webhookData = {
        url: context.webhookUrl,
        events: ['conversation.closed'],
        name: 'Activepieces - Conversation Closed',
        description: 'Webhook for conversation closed events',
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

      console.log('Webhook created for conversation closed events:', response);
    } catch (error) {
      console.error('Failed to create webhook for conversation closed events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for conversation closed events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for conversation closed events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a conversation closed event
    if (payload.event !== 'conversation.closed') {
      return [];
    }

    const conversation = payload.data;
    
    return [
      {
        id: conversation.id,
        contactId: conversation.contactId,
        channelId: conversation.channelId,
        status: conversation.status,
        assigneeId: conversation.assigneeId,
        closedAt: conversation.closedAt || conversation.updatedAt,
        closedBy: conversation.closedBy,
        closeReason: conversation.closeReason,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        contact: payload.data.contact || {},
        channel: payload.data.channel || {},
        lastMessage: payload.data.lastMessage || {},
        rawPayload: payload
      }
    ];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  },
  sampleData: {
    id: 'conv_123456789',
    contactId: 'contact_123456789',
    channelId: 'channel_123456789',
    status: 'closed',
    assigneeId: 'user_123456789',
    closedAt: '2024-01-01T13:00:00Z',
    closedBy: 'user_123456789',
    closeReason: 'resolved',
    createdAt: '2024-01-01T11:55:00Z',
    updatedAt: '2024-01-01T13:00:00Z',
    contact: {
      id: 'contact_123456789',
      phone: '+1234567890',
      firstName: 'John',
      lastName: 'Doe'
    },
    channel: {
      id: 'channel_123456789',
      name: 'WhatsApp Business',
      type: 'whatsapp'
    },
    lastMessage: {
      id: 'msg_987654321',
      content: 'Thank you for your help!',
      type: 'text',
      direction: 'incoming'
    }
  }
});
