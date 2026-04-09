import { instantlyTriggerFactory } from './common';

export const meetingBookedTrigger =
  instantlyTriggerFactory.createWebhookTrigger({
    name: 'meeting_booked',
    displayName: 'Meeting Booked',
    description: 'Triggers when a meeting is booked with a lead.',
    eventType: 'lead_meeting_booked',
    sampleData: {
      timestamp: '2025-01-15T12:00:00.000Z',
      event_type: 'lead_meeting_booked',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
      lead_email: 'lead@example.com',
      email_account: 'sender@company.com',
    },
  });
