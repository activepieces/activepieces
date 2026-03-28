import { createMailgunWebhookTrigger } from './common';

export const newFailedDeliveryEvent = createMailgunWebhookTrigger({
  name: 'new_failed_delivery_event',
  displayName: 'New Failed Delivery Event',
  description:
    'Triggers when an email temporarily fails to deliver in Mailgun (will be retried)',
  eventType: 'temporary_fail',
  testEventFilter: { event: 'failed', severity: 'temporary' },
  sampleData: {
    event: 'failed',
    id: 'def123',
    timestamp: 1710000000,
    recipient: 'user@example.com',
    domain: 'example.com',
    severity: 'temporary',
    reason: 'generic',
    log_level: 'warn',
    message_headers_message_id: '20240310120000.def123@example.com',
    message_headers_from: 'sender@example.com',
    message_headers_to: 'user@example.com',
    message_headers_subject: 'Important update',
    delivery_status_code: 452,
    delivery_status_message: 'Mailbox full',
    delivery_status_description: 'The recipient mailbox is full',
  },
});
