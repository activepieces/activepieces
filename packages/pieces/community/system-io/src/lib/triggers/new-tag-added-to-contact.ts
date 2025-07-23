import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeContact, SystemeTag } from '../common';

interface TagAddedWebhookPayload {
  event: string;
  contact: SystemeContact;
  tag: SystemeTag;
  timestamp?: string;
}

interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt?: string;
}

interface WebhookConfig {
  webhookId: string;
  filterTagName: string | null;
  url: string;
  events: string[];
}

export const newTagAddedToContactTrigger = createTrigger({
  auth: systemeAuth,
  name: 'new_tag_added_to_contact',
  displayName: 'New Tag Added to Contact',
  description: 'Fires when a specific tag is assigned to a contact in your Systeme.io account',
  props: {
    tagName: Property.ShortText({
      displayName: 'Tag Name (Optional)',
      description: 'Specific tag name to monitor. Leave empty to trigger on any tag addition.',
      required: false,
    }),
  },
  sampleData: {
    event: "contact.tag_added",
    contact: {
      id: "12345",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      locale: "en",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:35:00Z",
      tags: ["VIP", "Premium"]
    },
    tag: {
      id: "tag_123",
      name: "VIP"
    },
    timestamp: "2024-01-15T10:35:00Z"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      const filterTagName = systemeCommon.sanitizeString(context.propsValue.tagName);
      
      const webhookData = {
        url: context.webhookUrl,
        events: ['contact.tag_added'],
        active: true,
      };

      const webhook = await systemeCommon.makeRequestWithAuth<WebhookResponse>(
        context.auth,
        HttpMethod.POST,
        '/webhooks',
        webhookData
      );

      await context.store.put('systeme_tag_added_webhook', {
        webhookId: webhook.id,
        filterTagName: filterTagName || null,
        url: webhook.url,
        events: webhook.events,
      });

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to register tag added webhook: ${error.message}`);
      }
      throw new Error('Failed to register tag added webhook: Unknown error occurred');
    }
  },
  async onDisable(context) {
    try {
      const webhook = await context.store.get<WebhookConfig>('systeme_tag_added_webhook');
      if (webhook?.webhookId) {
        await systemeCommon.makeRequestWithAuth<void>(
          context.auth,
          HttpMethod.DELETE,
          `/webhooks/${webhook.webhookId}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to unregister tag added webhook:', errorMessage);
    }
  },
  async run(context) {
    const payload = context.payload.body as TagAddedWebhookPayload;
    
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid webhook payload received');
      return [];
    }

    if (payload.event !== 'contact.tag_added') {
      console.warn(`Unexpected event type: ${payload.event}`);
      return [];
    }

    if (!payload.contact || !payload.contact.id || !payload.contact.email) {
      console.warn('Invalid contact data in webhook payload');
      return [];
    }

    if (!payload.tag || !payload.tag.id || !payload.tag.name) {
      console.warn('Invalid tag data in webhook payload');
      return [];
    }
    
    try {
      const webhookConfig = await context.store.get<WebhookConfig>('systeme_tag_added_webhook');
      
      if (webhookConfig?.filterTagName) {
        const payloadTagName = payload.tag.name;
        if (payloadTagName !== webhookConfig.filterTagName) {
          return [];
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve webhook configuration, processing all tag events');
    }
    
    return [payload];
  },
});