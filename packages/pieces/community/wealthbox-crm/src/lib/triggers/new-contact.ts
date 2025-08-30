import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const newContactTrigger = createTrigger({
  auth: wealthboxCrmAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  type: TriggerStrategy.POLLING,
  props: {
    polling_interval: Property.Number({
      displayName: 'Polling Interval (seconds)',
      required: false,
      defaultValue: 60,
      description: 'How often to check for new contacts (minimum 60 seconds)',
    }),
  },
  async onEnable(context) {
    await context.store.put('last_contact_id', 0);
  },
  async run(context) {
    const { polling_interval = 60 } = context.propsValue;
    const lastContactId = await context.store.get('last_contact_id') || 0;
    
    const client = makeClient(context.auth);
    const contacts = await client.listContacts();
    
    const newContacts = contacts.contacts.filter((contact: any) => contact.id > lastContactId);
    
    if (newContacts.length > 0) {
      const maxContactId = Math.max(...newContacts.map((contact: any) => contact.id));
      await context.store.put('last_contact_id', maxContactId);
    }
    
    return newContacts;
  },
  sampleData: {
    id: 1,
    type: 'Person',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    company: 'Example Corp',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
});
