import { createMailgunWebhookTrigger } from './common';

export const newDeliveryEvent = createMailgunWebhookTrigger({
  name: 'new_delivery_event',
  displayName: 'New Delivery Event',
  description:
    'Triggers when an email is successfully delivered in Mailgun',
  eventType: 'delivered',
  testEventFilter: { event: 'delivered' },
  sampleData: {
    event: 'delivered',
    id: 'abc789',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    log_level: 'info',
    message_headers_message_id: '20240310120000.abc789@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Welcome to our service',
    delivery_status_code: 250,
    delivery_status_message: 'OK',
  },
});
