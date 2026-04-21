import { instantlyTriggerFactory } from './common';

export const leadStatusChangedTrigger = instantlyTriggerFactory.createGroupedWebhookTrigger({
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description: 'Triggers when a lead status changes, including interest level, unsubscribe, out-of-office, wrong person, and closed.',
  eventOptions: [
    { label: 'Interested', value: 'lead_interested' },
    { label: 'Not Interested', value: 'lead_not_interested' },
    { label: 'Neutral', value: 'lead_neutral' },
    { label: 'Unsubscribed', value: 'lead_unsubscribed' },
    { label: 'Closed', value: 'lead_closed' },
    { label: 'Out of Office', value: 'lead_out_of_office' },
    { label: 'Wrong Person', value: 'lead_wrong_person' },
  ],
  sampleData: {
    timestamp: '2025-01-15T10:30:00.000Z',
    event_type: 'lead_interested',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
    unibox_url: 'https://app.instantly.ai/app/unibox?emailId=email_123',
  },
});
