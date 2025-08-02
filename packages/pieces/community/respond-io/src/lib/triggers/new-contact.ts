import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const newContactTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  props: {
    channelFilter: Property.Array({
      displayName: 'Channel Filter',
      description: 'Filter contacts by specific channels (leave empty for all channels)',
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
      // Create webhook for new contact events
      const webhookData = {
        url: context.webhookUrl,
        events: ['contact.created'],
        name: 'Activepieces - New Contact',
        description: 'Webhook for new contact events',
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

      console.log('Webhook created for new contact events:', response);
    } catch (error) {
      console.error('Failed to create webhook for new contact events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for new contact events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for new contact events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a contact created event
    if (payload.event !== 'contact.created') {
      return [];
    }

    const contact = payload.data;
    
    return [
      {
        id: contact.id,
        phone: contact.phone,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        language: contact.language,
        timezone: contact.timezone,
        tags: contact.tags || [],
        customFields: contact.customFields || {},
        channelId: contact.channelId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
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
    id: 'contact_123456789',
    phone: '+1234567890',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    language: 'en',
    timezone: 'America/New_York',
    tags: ['customer', 'vip'],
    customFields: {
      company: 'Acme Corp',
      department: 'Sales'
    },
    channelId: 'channel_123456789',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    channel: {
      id: 'channel_123456789',
      name: 'WhatsApp Business',
      type: 'whatsapp'
    }
  }
});
