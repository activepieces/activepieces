import { createGorgiasWebhookTrigger } from './create-trigger';

export const newTicket = createGorgiasWebhookTrigger({
  name: 'new_ticket',
  displayName: 'New Ticket',
  description: 'Triggers when a new ticket is created.',
  event: 'ticket-created',
  withMessageFields: false,
  sampleData: {
    id: 123,
    subject: 'Can I get a refund?',
    status: 'open',
    priority: 'normal',
    channel: 'email',
    via: 'email',
    language: 'en',
    customer_id: 3924,
    customer_email: 'john@example.com',
    customer_name: 'John Smith',
    assignee_user_id: null,
    assignee_user_email: null,
    created_datetime: '2019-07-05T14:42:00.384938',
    updated_datetime: '2019-07-05T14:42:00.384938',
  },
});
