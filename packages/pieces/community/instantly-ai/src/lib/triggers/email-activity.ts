import { instantlyTriggerFactory } from './common';

export const emailActivityTrigger = instantlyTriggerFactory.createGroupedWebhookTrigger({
  name: 'email_activity',
  displayName: 'Email Activity',
  description: 'Triggers on email-related events such as sends, opens, clicks, bounces, and replies.',
  aiDescription:
    'Fires on Instantly email engagement events for a campaign — sent, opened, link clicked, bounced, reply received, and auto-reply received — with the selected event types chosen per flow and a single webhook registered automatically. Delivers the raw event payload including campaign, lead email, sending account, and reply text. Optionally scoped to one campaign.',
  eventOptions: [
    { label: 'Email Sent', value: 'email_sent' },
    { label: 'Email Opened', value: 'email_opened' },
    { label: 'Link Clicked', value: 'email_link_clicked' },
    { label: 'Email Bounced', value: 'email_bounced' },
    { label: 'Reply Received', value: 'reply_received' },
    { label: 'Auto-Reply Received', value: 'auto_reply_received' },
  ],
  sampleData: {
    timestamp: '2025-01-15T10:30:00.000Z',
    event_type: 'reply_received',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    campaign_name: 'Product Demo Outreach',
    lead_email: 'lead@example.com',
    email_account: 'sender@company.com',
    email_subject: 'Quick question about your product',
    reply_subject: 'Re: Quick question about your product',
    reply_text: 'Hi, I would love to learn more about your product.',
    reply_text_snippet: 'I would love to learn more...',
  },
});
