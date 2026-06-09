import { createMailgunWebhookTrigger } from './common';

export const newComplaintEvent = createMailgunWebhookTrigger({
  name: 'new_complaint_event',
  displayName: 'New Complaint Event',
  description:
    'Triggers when a recipient reports an email as spam in Mailgun',
  eventType: 'complained',
  testEventFilter: { event: 'complained' },
  sampleData: {
    event: 'complained',
    id: 'abc456',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'warn',
    message_headers_message_id: '20240310120000.abc456@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Newsletter March 2024',
  },
});
