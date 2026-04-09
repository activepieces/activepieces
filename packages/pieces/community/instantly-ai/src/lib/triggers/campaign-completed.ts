import { instantlyTriggerFactory } from './common';

export const campaignCompletedTrigger =
  instantlyTriggerFactory.createWebhookTrigger({
    name: 'campaign_completed',
    displayName: 'Campaign Completed',
    description: 'Triggers when a campaign completes.',
    eventType: 'campaign_completed',
    sampleData: {
      timestamp: '2025-01-20T18:00:00.000Z',
      event_type: 'campaign_completed',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
    },
  });
