import { createMailgunWebhookTrigger } from './common';

export const newBounceEvent = createMailgunWebhookTrigger({
  name: 'new_bounce_event',
  displayName: 'New Bounce Event',
  description:
    'Triggers when an email permanently fails to deliver (hard bounce) in Mailgun',
  eventType: 'permanent_fail',
  testEventFilter: { event: 'failed', severity: 'permanent' },
  sampleData: {
    event: 'failed',
    id: 'abc123',
    timestamp: 1710000000,
    recipient: 'bounce@example.com',
    domain: 'example.com',
    severity: 'permanent',
    reason: 'bounce',
    log_level: 'error',
    message_headers_message_id: '20240310120000.abc123@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'bounce@example.com',
    message_headers_subject: 'Test email',
    delivery_status_code: 550,
    delivery_status_message: 'Mailbox not found',
    delivery_status_description: 'The email account does not exist',
  },
});
