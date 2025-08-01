import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';

export const newContactGroupTrigger = createTrigger({
  auth: missiveAuth,
  name: 'new_contact_group',
  displayName: 'New Contact Group',
  description: 'Fires when a new contact group is created within a contact book',
  props: {
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'Filter groups by specific contact book ID (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    id: 'group_123',
    name: 'My Contact Group',
    contact_book_id: 'book_123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  onEnable: async (context) => {
    // Set up webhook for new contact groups
    context.app.createListeners({
      events: ['contact_group.created'],
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