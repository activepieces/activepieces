import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const contactUpdatedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'contact_updated',
  displayName: 'Contact Updated',
  description: 'Triggers when a contact is updated',
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
    }),
    fieldFilter: Property.Array({
      displayName: 'Field Filter',
      description: 'Only trigger when specific fields are updated (leave empty for any field)',
      required: false,
      properties: {
        fieldName: Property.ShortText({
          displayName: 'Field Name',
          description: 'Name of the field to monitor (e.g., firstName, email, phone)',
          required: true
        })
      }
    })
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      // Create webhook for contact updated events
      const webhookData = {
        url: context.webhookUrl,
        events: ['contact.updated'],
        name: 'Activepieces - Contact Updated',
        description: 'Webhook for contact updated events',
        filters: {
          ...(context.propsValue.channelFilter && context.propsValue.channelFilter.length > 0
            ? { channels: context.propsValue.channelFilter.map(filter => filter.channelId) }
            : {}),
          ...(context.propsValue.fieldFilter && context.propsValue.fieldFilter.length > 0
            ? { fields: context.propsValue.fieldFilter.map(filter => filter.fieldName) }
            : {})
        }
      };

      const response = await client.makeRequest(HttpMethod.POST, '/webhook', undefined, webhookData);
      
      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        webhookId: response.id,
        webhookUrl: context.webhookUrl
      });

      console.log('Webhook created for contact updated events:', response);
    } catch (error) {
      console.error('Failed to create webhook for contact updated events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for contact updated events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for contact updated events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a contact updated event
    if (payload.event !== 'contact.updated') {
      return [];
    }

    const contact = payload.data;
    const changes = payload.data.changes || {};
    
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
        changes: changes,
        updatedFields: Object.keys(changes),
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
    lastName: 'Smith',
    fullName: 'John Smith',
    language: 'en',
    timezone: 'America/New_York',
    tags: ['customer', 'vip', 'premium'],
    customFields: {
      company: 'Acme Corp',
      department: 'Sales'
    },
    channelId: 'channel_123456789',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T14:30:00Z',
    changes: {
      lastName: {
        from: 'Doe',
        to: 'Smith'
      },
      tags: {
        added: ['premium'],
        removed: []
      }
    },
    updatedFields: ['lastName', 'tags'],
    channel: {
      id: 'channel_123456789',
      name: 'WhatsApp Business',
      type: 'whatsapp'
    }
  }
});
