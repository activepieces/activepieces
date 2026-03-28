import { createMailgunWebhookTrigger } from './common';

export const newUnsubscribeEvent = createMailgunWebhookTrigger({
  name: 'new_unsubscribe_event',
  displayName: 'New Unsubscribe Event',
  description:
    'Triggers when a recipient unsubscribes from emails in Mailgun',
  eventType: 'unsubscribed',
  testEventFilter: { event: 'unsubscribed' },
  sampleData: {
    event: 'unsubscribed',
    id: 'jkl123',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'info',
    ip: '192.168.1.1',
    client_info_client_name: 'Chrome',
    client_info_client_os: 'macOS',
    client_info_device_type: 'desktop',
    message_headers_message_id: '20240310120000.jkl123@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Weekly newsletter',
  },
});
