import { createNotifyWebhookTrigger } from '../common/webhook-factory';

export const emailClickedTrigger = createNotifyWebhookTrigger({
  event: { id: 7, key: 'clicked' },
  name: 'email_clicked',
  displayName: 'Email Link Clicked',
  description:
    'Triggers when a recipient clicks a tracked link inside a transactional email.',
  sampleData: {
    event: 'Clicked',
    eventId: 7,
    messageId: '5df9d4b691183c000106cb90',
    email: 'jane@example.com',
    occurredAt: '2024-01-15T10:30:00.000Z',
    url: 'https://example.com/promo',
    userAgent: 'Mozilla/5.0',
    ip: '203.0.113.42',
  },
});
