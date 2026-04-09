import { instantlyTriggerFactory } from './common';

export const emailBouncedTrigger =
  instantlyTriggerFactory.createWebhookTrigger({
    name: 'email_bounced',
    displayName: 'Email Bounced',
    description: 'Triggers when an email bounces.',
    eventType: 'email_bounced',
    sampleData: {
      timestamp: '2025-01-15T09:05:00.000Z',
      event_type: 'email_bounced',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
      lead_email: 'invalid@example.com',
      email_account: 'sender@company.com',
    },
  });
