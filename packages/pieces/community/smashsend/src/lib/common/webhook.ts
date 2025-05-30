import { createClient } from './index';
import { TriggerStrategy } from '@activepieces/pieces-framework';

export const WEBHOOK_EVENTS = {
  CONTACT_CREATED: 'CONTACT_CREATED',
  CONTACT_UPDATED: 'CONTACT_UPDATED',
  CONTACT_DELETED: 'CONTACT_DELETED',
  CONTACT_UNSUBSCRIBED: 'CONTACT_UNSUBSCRIBED',
  CONTACT_RESUBSCRIBED: 'CONTACT_RESUBSCRIBED',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

export interface WebhookData {
  id: string;
  events: string[];
}

export const normalizeContactData = (data: any, eventType: string): any => {
  if (!data || typeof data !== 'object') {
    return {
      email: '',
      id: '',
      firstName: '',
      lastName: '',
      status: '',
      phone: '',
      event: eventType,
      createdAt: '',
      updatedAt: '',
      properties: {},
    };
  }

  // Extract contact from various possible structures
  let contact = data;
  if (data.contact && typeof data.contact === 'object') {
    contact = data.contact;
  }
  if (data.payload?.contact && typeof data.payload.contact === 'object') {
    contact = data.payload.contact;
  }

  // Helper to ensure string values
  const extractString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  };

  // Normalize the contact data
  return {
    email: extractString(contact.properties?.email || contact.email || ''),
    id: extractString(contact.id || contact.contactId || ''),
    firstName: extractString(
      contact.properties?.firstName || contact.firstName || ''
    ),
    lastName: extractString(
      contact.properties?.lastName || contact.lastName || ''
    ),
    status: extractString(contact.properties?.status || contact.status || ''),
    phone: extractString(contact.properties?.phone || contact.phone || ''),
    event: eventType,
    createdAt: extractString(contact.createdAt || contact.created_at || ''),
    updatedAt: extractString(contact.updatedAt || contact.updated_at || ''),
    workspaceId: extractString(
      contact.workspaceId || contact.workspace_id || ''
    ),
    properties: contact.properties || {},
  };
};

export const createWebhookTrigger = (
  eventKey: WebhookEvent,
  displayName: string,
  description: string
) => {
  return {
    auth: undefined, // Will be set by the actual trigger
    name: eventKey.toLowerCase().replace(/_/g, '-'),
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {}, // Empty props as webhooks don't need configuration
    sampleData: {
      email: 'john.doe@example.com',
      id: 'ctc_de7K3MwPA5j0mw5A4pJQMbeZ',
      firstName: 'John',
      lastName: 'Doe',
      status: 'SUBSCRIBED',
      phone: '+1234567890',
      event: eventKey,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      workspaceId: 'wrk_uHMCacntgyuo2HtdYeKU0pm1',
      properties: {
        customField1: 'value1',
        customField2: 'value2',
      },
    },
    async onEnable(context: any): Promise<void> {
      try {
        const client = createClient(context.auth.apiKey);
        const webhook = await client.webhooks.create({
          events: [eventKey],
          url: context.webhookUrl!,
        });

        await context.store?.put(`smashsend_webhook_${eventKey}`, {
          id: webhook.id,
          events: [eventKey],
        });
      } catch (error: any) {
        throw new Error(`Failed to create webhook: ${error.message}`);
      }
    },
    async onDisable(context: any): Promise<void> {
      const webhookData = await context.store?.get(
        `smashsend_webhook_${eventKey}`
      );

      if (!webhookData) {
        return;
      }

      try {
        const client = createClient(context.auth.apiKey);
        await client.webhooks.delete(webhookData.id);
      } catch (error: any) {
        // Ignore errors on cleanup - webhook might already be deleted
      }
    },
    async run(context: any): Promise<unknown[]> {
      const payload = context.payload.body;
      if (!payload) {
        return [];
      }

      const normalized = normalizeContactData(payload, eventKey);
      return [normalized];
    },
  };
}; 