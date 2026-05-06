import { instantlyTriggerFactory } from './common';

export const campaignAccountTrigger = instantlyTriggerFactory.createGroupedWebhookTrigger({
  name: 'campaign_account',
  displayName: 'Campaign / Account',
  description: 'Triggers on campaign-level events such as completion or account errors.',
  eventOptions: [
    { label: 'Campaign Completed', value: 'campaign_completed' },
    { label: 'Account Error', value: 'account_error' },
  ],
  sampleData: {
    timestamp: '2025-01-15T10:30:00.000Z',
    event_type: 'campaign_completed',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
  },
});
