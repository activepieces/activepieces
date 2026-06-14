import { createNotifyWebhookTrigger } from '../common/webhook-factory';

export const emailBouncedTrigger = createNotifyWebhookTrigger({
  event: { id: 0, key: 'hard_bounce' },
  name: 'email_bounced',
  displayName: 'Email Bounced',
  description:
    'Triggers when a transactional email permanently bounces (hard bounce) — the recipient address does not exist or is blocked.',
  aiMetadata: {
    description:
      'Fires when a transactional email sent through INBOX Notify hard-bounces, meaning the recipient address is permanently undeliverable (does not exist or is blocked). Represents a permanent delivery failure for a specific message and recipient.',
  },
  sampleData: {
    event: 'HardBounce',
    eventId: 0,
    messageId: '5df9d4b691183c000106cb90',
    email: 'jane@example.com',
    occurredAt: '2024-01-15T10:30:00.000Z',
    reason: '550 5.1.1 User unknown',
  },
});
