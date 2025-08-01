import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newContactTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a contact book',
  props: {
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'Filter contacts by specific contact book ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'contact_123',
    email: 'contact@example.com',
    first_name: 'John',
    last_name: 'Doe',
    company: 'Example Corp',
    contact_book_id: 'book_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  onEnable: async (context) => {
    // Set up webhook for new contacts
    context.app.createListeners({
      events: ['contact.created'],
      identifierValue: context.auth.apiToken,
    });
  },
  onDisable: async () => {
    // Clean up webhook
  },
  run: async (context) => {
    const payloadBody = context.payload.body as Record<string, unknown>;
    
    // Filter by contact book ID if specified
    if (context.propsValue.contactBookId && 
        payloadBody.contact_book_id !== context.propsValue.contactBookId) {
      return [];
    }

    return [payloadBody];
  },
}); 