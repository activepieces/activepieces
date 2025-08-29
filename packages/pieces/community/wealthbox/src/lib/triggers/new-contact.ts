import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to retrieve',
      required: false,
      defaultValue: 10,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'contact_123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    tags: ['prospect', 'financial-advisor'],
    household_id: 'household_456',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  onEnable: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    // Store the current timestamp to only get new contacts
    await context.store.put('lastContactCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastContactCheck');
  },
  run: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    const lastCheck = await context.store.get<string>('lastContactCheck');
    const limit = context.propsValue.limit || 10;

    try {
      const response = await client.getContacts({ limit });
      const contacts = response.data;

      // Filter contacts created after the last check
      const newContacts = contacts.filter(contact => {
        if (!lastCheck) return true;
        return new Date(contact.created_at!) > new Date(lastCheck);
      });

      // Update the last check timestamp
      if (contacts.length > 0) {
        const latestContact = contacts.reduce((latest, current) => 
          new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest
        );
        await context.store.put('lastContactCheck', latestContact.created_at);
      }

      return newContacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },
}); 