import { createMailgunWebhookTrigger } from './common';

export const newClickEvent = createMailgunWebhookTrigger({
  name: 'new_click_event',
  displayName: 'New Click Event',
  description:
    'Triggers when a recipient clicks a tracked link in an email in Mailgun',
  eventType: 'clicked',
  testEventFilter: { event: 'clicked' },
  sampleData: {
    event: 'clicked',
    id: 'ghi456',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'info',
    url: 'https://example.com/landing',
    ip: '192.168.1.1',
    client_info_client_name: 'Chrome',
    client_info_client_os: 'macOS',
    client_info_device_type: 'desktop',
    message_headers_message_id: '20240310120000.ghi456@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Check out our new feature',
  },
});
