import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';

export const contactTagUpdatedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'contact_tag_updated',
  displayName: 'Contact Tag Updated',
  description: 'Triggers when tags are added or removed from a contact',
  props: {
    tagFilter: Property.Array({
      displayName: 'Tag Filter',
      description: 'Only trigger for specific tags (leave empty for all tags)',
      required: false,
      properties: {
        tagName: Property.ShortText({
          displayName: 'Tag Name',
          required: true
        })
      }
    }),
    actionFilter: Property.StaticDropdown({
      displayName: 'Action Filter',
      description: 'Filter by tag action type',
      required: false,
      options: {
        options: [
          { label: 'Any Action', value: 'any' },
          { label: 'Tag Added', value: 'added' },
          { label: 'Tag Removed', value: 'removed' }
        ]
      },
      defaultValue: 'any'
    })
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      // Create webhook for contact tag updated events
      const webhookData = {
        url: context.webhookUrl,
        events: ['contact.tag.updated'],
        name: 'Activepieces - Contact Tag Updated',
        description: 'Webhook for contact tag updated events',
        filters: {
          ...(context.propsValue.tagFilter && context.propsValue.tagFilter.length > 0
            ? { tags: context.propsValue.tagFilter.map(filter => filter.tagName) }
            : {}),
          ...(context.propsValue.actionFilter && context.propsValue.actionFilter !== 'any'
            ? { action: context.propsValue.actionFilter }
            : {})
        }
      };

      const response = await client.makeRequest(HttpMethod.POST, '/webhook', undefined, webhookData);
      
      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        webhookId: response.id,
        webhookUrl: context.webhookUrl
      });

      console.log('Webhook created for contact tag updated events:', response);
    } catch (error) {
      console.error('Failed to create webhook for contact tag updated events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new RespondIoClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.makeRequest(HttpMethod.DELETE, `/webhook/${webhookDetails.webhookId}`);
        console.log('Webhook deleted for contact tag updated events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for contact tag updated events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a contact tag updated event
    if (payload.event !== 'contact.tag.updated') {
      return [];
    }

    const contact = payload.data.contact;
    const tagChanges = payload.data.tagChanges || {};
    
    return [
      {
        contactId: contact.id,
        contactPhone: contact.phone,
        contactEmail: contact.email,
        contactFirstName: contact.firstName,
        contactLastName: contact.lastName,
        contactFullName: contact.fullName,
        currentTags: contact.tags || [],
        tagChanges: {
          added: tagChanges.added || [],
          removed: tagChanges.removed || []
        },
        addedTags: tagChanges.added || [],
        removedTags: tagChanges.removed || [],
        updatedAt: payload.data.updatedAt || new Date().toISOString(),
        contact: contact,
        rawPayload: payload
      }
    ];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  },
  sampleData: {
    contactId: 'contact_123456789',
    contactPhone: '+1234567890',
    contactEmail: 'john.doe@example.com',
    contactFirstName: 'John',
    contactLastName: 'Doe',
    contactFullName: 'John Doe',
    currentTags: ['customer', 'vip', 'premium'],
    tagChanges: {
      added: ['premium'],
      removed: ['trial']
    },
    addedTags: ['premium'],
    removedTags: ['trial'],
    updatedAt: '2024-01-01T14:30:00Z',
    contact: {
      id: 'contact_123456789',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      tags: ['customer', 'vip', 'premium']
    }
  }
});
