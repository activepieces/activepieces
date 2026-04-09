import { instantlyTriggerFactory } from './common';

export const replyReceivedTrigger =
  instantlyTriggerFactory.createWebhookTrigger({
    name: 'reply_received',
    displayName: 'Reply Received',
    description: 'Triggers when a lead replies to an email.',
    eventType: 'reply_received',
    sampleData: {
      timestamp: '2025-01-15T10:30:00.000Z',
      event_type: 'reply_received',
      workspace: 'workspace_123456',
      campaign_id: 'campaign_789012',
      campaign_name: 'Product Demo Outreach',
      lead_email: 'lead@example.com',
      email_account: 'sender@company.com',
      reply_subject: 'Re: Quick question about your product',
      reply_text: 'Hi, I would love to learn more about your product.',
      reply_text_snippet: 'I would love to learn more...',
    },
  });
