import { createMailgunWebhookTrigger } from './common';

export const newOpenClickEvent = createMailgunWebhookTrigger({
  name: 'new_open_click_event',
  displayName: 'New Open/Click Event',
  description:
    'Triggers when a recipient opens an email or clicks a tracked link in Mailgun. Note: this registers for both "opened" and "clicked" events (uses the "clicked" webhook type). Use the "event" field in the output to distinguish between opens and clicks.',
  eventType: 'clicked',
  sampleData: {
    event: 'clicked',
    id: 'ghi123',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'info',
    url: 'https://example.com/landing',
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
