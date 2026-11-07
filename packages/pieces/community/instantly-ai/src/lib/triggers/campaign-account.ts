import { instantlyTriggerFactory } from './common';

export const campaignAccountTrigger = instantlyTriggerFactory.createGroupedWebhookTrigger({
  name: 'campaign_account',
  displayName: 'Campaign / Account',
  description: 'Triggers on campaign-level events such as completion or account errors.',
  aiDescription:
    'Fires on Instantly campaign-level and sending-account events — campaign completed and account error — with the selected events chosen per flow and a single webhook registered automatically. Delivers the raw event payload including campaign id and name. Optionally scoped to one campaign.',
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
