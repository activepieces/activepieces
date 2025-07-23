import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeContact } from '../common';

interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt?: string;
}

interface WebhookPayload {
  event: string;
  contact: SystemeContact;
  timestamp?: string;
}

export const newContactTrigger = createTrigger({
  auth: systemeAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created in your Systeme.io account',
  props: {},
  sampleData: {
    event: "contact.created",
    contact: {
      id: "12345",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      locale: "en",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      customFields: {
        company: "Example Corp"
      },
      tags: ["lead", "website"]
    },
    timestamp: "2024-01-15T10:30:00Z"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      const webhookData = {
        url: context.webhookUrl,
        events: ['contact.created'],
        active: true,
      };

      const webhook = await systemeCommon.makeRequestWithAuth<WebhookResponse>(
        context.auth,
        HttpMethod.POST,
        '/webhooks',
        webhookData
      );

      await context.store.put('systeme_new_contact_webhook', {
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events,
      });

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to register new contact webhook: ${error.message}`);
      }
      throw new Error('Failed to register new contact webhook: Unknown error occurred');
    }
  },
  async onDisable(context) {
    try {
      const webhook = await context.store.get<{ webhookId: string; url: string; events: string[] }>('systeme_new_contact_webhook');
      if (webhook?.webhookId) {
        await systemeCommon.makeRequestWithAuth<void>(
          context.auth,
          HttpMethod.DELETE,
          `/webhooks/${webhook.webhookId}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to unregister new contact webhook:', errorMessage);
    }
  },
  async run(context) {
    const payload = context.payload.body as WebhookPayload;
    
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid webhook payload received');
      return [];
    }

    if (payload.event !== 'contact.created') {
      console.warn(`Unexpected event type: ${payload.event}`);
      return [];
    }

    if (!payload.contact || !payload.contact.id || !payload.contact.email) {
      console.warn('Invalid contact data in webhook payload');
      return [];
    }

    return [payload];
  },
}); 