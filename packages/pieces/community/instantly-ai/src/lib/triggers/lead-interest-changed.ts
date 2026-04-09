import { instantlyTriggerFactory } from './common';

export const leadInterestChangedTrigger =
  instantlyTriggerFactory.createDynamicWebhookTrigger({
    name: 'lead_interest_changed',
    displayName: 'Lead Interest Changed',
    description:
      'Triggers when a lead interest status changes (interested, not interested, or neutral).',
    sampleData: {
      timestamp: '2025-01-15T15:00:00.000Z',
      event_type: 'lead_interested',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
      lead_email: 'lead@example.com',
      email_account: 'sender@company.com',
    },
  });
