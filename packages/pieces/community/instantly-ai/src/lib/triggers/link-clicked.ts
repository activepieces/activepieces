import { instantlyTriggerFactory } from './common';

export const linkClickedTrigger = instantlyTriggerFactory.createWebhookTrigger({
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description: 'Triggers when a lead clicks a tracked link in an email.',
  eventType: 'email_link_clicked',
  sampleData: {
    timestamp: '2025-01-15T14:20:00.000Z',
    event_type: 'email_link_clicked',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
  },
});
