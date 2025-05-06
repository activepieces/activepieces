import { createTrigger, PieceAuth, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { closeAuth } from '../..';
import { makeClient } from '../common/client';
import { CloseCRMWebhookLead } from '../common/types';

export const newLeadAdded = createTrigger({
  auth: closeAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is created in Close CRM',
  type: TriggerStrategy.WEBHOOK,
  props: {
    // Optional: Add filters if needed (e.g., for specific lead statuses)
    status_filter: Property.StaticDropdown({
      displayName: 'Status Filter',
      required: false,
      options: {
        options: [
          { label: 'Any Status', value: 'any' },
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
        ],
      },
    }),
  },

  // Webhook setup and verification
  async onEnable(context) {
    const client = makeClient(context.auth);
    const webhookUrl = context.webhookUrl;

    // Register the webhook with Close CRM
    const response = await client.post('/webhooks/', {
      url: webhookUrl,
      event_types: ['lead.created'],
      ...(context.propsValue.status_filter && context.propsValue.status_filter !== 'any' && {
        query: `status:"${context.propsValue.status_filter}"`
      }),
    });

    // Store webhook ID for later reference
    await context.store.put('close_crm_webhook_id', response.data.id);
  },

  // Clean up when disabling
  async onDisable(context) {
    const client = makeClient(context.auth);
    const webhookId = await context.store.get('close_crm_webhook_id');

    if (webhookId) {
      await client.delete(`/webhooks/${webhookId}`);
    }
  },

  // Process incoming webhook payload
  async run(context) {
    const payload = context.payload.body as { data: CloseCRMWebhookLead };
    return [payload.data];
  },

  // Sample data for testing
  sampleData: {
    id: 'lead_123',
    name: 'Sample Lead',
    status_id: 'New',
    contacts: [
      {
        name: 'John Doe',
        emails: [{ email: 'john@example.com' }],
        phones: [{ phone: '+1234567890' }]
      }
    ],
    date_created: new Date().toISOString()
  }
});