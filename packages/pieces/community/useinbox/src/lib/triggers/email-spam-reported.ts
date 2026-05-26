import { createNotifyWebhookTrigger } from '../common/webhook-factory';

export const emailSpamReportedTrigger = createNotifyWebhookTrigger({
  event: { id: 2, key: 'spam_reported' },
  name: 'email_spam_reported',
  displayName: 'Email Spam Reported',
  description:
    'Triggers when a recipient marks a transactional email as spam in their inbox.',
  sampleData: {
    event: 'SpamReported',
    eventId: 2,
    messageId: '5df9d4b691183c000106cb90',
    email: 'jane@example.com',
    occurredAt: '2024-01-15T10:30:00.000Z',
  },
});
