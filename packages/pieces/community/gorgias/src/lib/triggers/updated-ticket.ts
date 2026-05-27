import { createGorgiasWebhookTrigger } from './create-trigger';

export const updatedTicket = createGorgiasWebhookTrigger({
  name: 'updated_ticket',
  displayName: 'Updated Ticket',
  description: 'Triggers when any field of a ticket is updated.',
  event: 'ticket-updated',
  withMessageFields: false,
  sampleData: {
    id: 123,
    subject: 'Can I get a refund?',
    status: 'open',
    priority: 'high',
    channel: 'email',
    via: 'email',
    language: 'en',
    customer_id: 3924,
    customer_email: 'john@example.com',
    customer_name: 'John Smith',
    assignee_user_id: 7,
    assignee_user_email: 'agent@example.com',
    created_datetime: '2019-07-05T14:42:00.384938',
    updated_datetime: '2020-01-27T10:42:21.932637',
  },
});
