import { createGorgiasWebhookTrigger } from './create-trigger';

export const ticketStatusUpdated = createGorgiasWebhookTrigger({
  name: 'ticket_status_updated',
  displayName: 'Ticket Status Updated',
  description: 'Triggers when a ticket is opened or closed.',
  event: 'ticket-status-updated',
  withMessageFields: false,
  sampleData: {
    id: 123,
    subject: 'Can I get a refund?',
    status: 'closed',
    priority: 'normal',
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
