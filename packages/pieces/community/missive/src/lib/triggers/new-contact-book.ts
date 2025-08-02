import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newContactBookTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_contact_book',
  displayName: 'New Contact Book',
  description: 'Fires when a new contact book is created in Missive',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {},
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