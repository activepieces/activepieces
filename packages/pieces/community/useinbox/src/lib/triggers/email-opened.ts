import { createNotifyWebhookTrigger } from '../common/webhook-factory';

export const emailOpenedTrigger = createNotifyWebhookTrigger({
  event: { id: 5, key: 'opened' },
  name: 'email_opened',
  displayName: 'Email Opened',
  description:
    'Triggers each time a transactional email is opened by the recipient. Fires on every open (not unique).',
  aiMetadata: {
    description:
      'Fires each time a recipient opens a transactional email sent through INBOX Notify. Fires on every open, not only the first, so the same message and recipient can trigger it repeatedly.',
  },
  sampleData: {
    event: 'Opened',
    eventId: 5,
    messageId: '5df9d4b691183c000106cb90',
    email: 'jane@example.com',
    occurredAt: '2024-01-15T10:30:00.000Z',
    userAgent: 'Mozilla/5.0',
    ip: '203.0.113.42',
  },
});
