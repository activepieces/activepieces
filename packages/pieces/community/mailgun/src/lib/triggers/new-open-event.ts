import { createMailgunWebhookTrigger } from './common';

export const newOpenEvent = createMailgunWebhookTrigger({
  name: 'new_open_event',
  displayName: 'New Open Event',
  description:
    'Triggers when a recipient opens an email in Mailgun',
  eventType: 'opened',
  testEventFilter: { event: 'opened' },
  sampleData: {
    event: 'opened',
    id: 'ghi123',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'info',
    ip: '192.168.1.1',
    client_info_client_name: 'Chrome',
    client_info_client_os: 'macOS',
    client_info_device_type: 'desktop',
    message_headers_message_id: '20240310120000.ghi123@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Check out our new feature',
  },
});
