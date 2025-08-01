import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newContactBookTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_contact_book',
  displayName: 'New Contact Book',
  description: 'Fires when a new contact book is created in Missive',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'book_123',
    name: 'My Contact Book',
    description: 'A new contact book',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  onEnable: async (context) => {
    // Set up webhook for new contact books
    context.app.createListeners({
      events: ['contact_book.created'],
      identifierValue: context.auth.apiToken,
    });
  },
  onDisable: async () => {
    // Clean up webhook
  },
  run: async (context) => {
    const payloadBody = context.payload.body as Record<string, unknown>;
    return [payloadBody];
  },
}); 