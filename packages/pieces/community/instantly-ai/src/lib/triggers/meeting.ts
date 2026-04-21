import { instantlyTriggerFactory } from './common';

export const meetingTrigger = instantlyTriggerFactory.createGroupedWebhookTrigger({
  name: 'meeting',
  displayName: 'Meeting',
  description: 'Triggers when a meeting is booked or completed with a lead.',
  eventOptions: [
    { label: 'Meeting Booked', value: 'lead_meeting_booked' },
    { label: 'Meeting Completed', value: 'lead_meeting_completed' },
  ],
  sampleData: {
    timestamp: '2025-01-15T10:30:00.000Z',
    event_type: 'lead_meeting_booked',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
    unibox_url: 'https://app.instantly.ai/app/unibox?emailId=email_123',
  },
});
