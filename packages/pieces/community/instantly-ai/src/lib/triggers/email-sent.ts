import { instantlyTriggerFactory } from './common';

export const emailSentTrigger = instantlyTriggerFactory.createWebhookTrigger({
  name: 'email_sent',
  displayName: 'Email Sent',
  description: 'Triggers when an email is sent to a lead.',
  eventType: 'email_sent',
  sampleData: {
    timestamp: '2025-01-15T09:00:00.000Z',
    event_type: 'email_sent',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
    email_subject: 'Quick question about your workflow',
    step: 1,
    variant: 'A',
    is_first: true,
  },
});
