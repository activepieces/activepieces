import { instantlyTriggerFactory } from './common';

export const leadUnsubscribedTrigger =
  instantlyTriggerFactory.createWebhookTrigger({
    name: 'lead_unsubscribed',
    displayName: 'Lead Unsubscribed',
    description: 'Triggers when a lead unsubscribes from emails.',
    eventType: 'lead_unsubscribed',
    sampleData: {
      timestamp: '2025-01-15T16:30:00.000Z',
      event_type: 'lead_unsubscribed',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
      lead_email: 'lead@example.com',
      email_account: 'sender@company.com',
    },
  });
