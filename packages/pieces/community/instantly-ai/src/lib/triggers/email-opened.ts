import { instantlyTriggerFactory } from './common';

export const emailOpenedTrigger = instantlyTriggerFactory.createWebhookTrigger({
  name: 'email_opened',
  displayName: 'Email Opened',
  description: 'Triggers when a lead opens an email.',
  eventType: 'email_opened',
  sampleData: {
    timestamp: '2025-01-15T11:45:00.000Z',
    event_type: 'email_opened',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
  },
});
