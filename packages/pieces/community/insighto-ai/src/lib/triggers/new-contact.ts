import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ContactItemSchema, ContactItem } from '../schemas';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  props: {},
  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    channels: {},
    user_attributes: {},
    last_seen: '2023-11-07T05:31:56Z',
    last_sent: '2023-11-07T05:31:56Z',
    org_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    first_assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    last_assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    first_widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    last_widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    custom_fields: {},
    created_at: '2023-11-07T05:31:56Z'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Initialize with empty seen contacts
    await context.store.put('seen_contacts', []);
  },
  async onDisable(context) {
    await context.store.delete('seen_contacts');
  },
  async run(context) {
    try {
      const apiKey = context.auth as string;
      const url = `https://api.insighto.ai/api/v1/contact`;

      const queryParams: Record<string, string> = {
        api_key: apiKey,
        page: '1',
        size: '100',
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        queryParams,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.body.data;
      if (!data || !data.items) {
        return [];
      }

      const validatedContacts: ContactItem[] = [];
      for (const contact of data.items) {
        try {
          const validContact = ContactItemSchema.parse(contact);
          validatedContacts.push(validContact);
        } catch {
          continue;
        }
      }

      const seenContacts = (await context.store.get<string[]>('seen_contacts')) || [];
      const newContacts: ContactItem[] = [];
      const allContactIds = validatedContacts.map(c => c.id);

      for (const contact of validatedContacts) {
        if (!seenContacts.includes(contact.id)) {
          newContacts.push(contact);
        }
      }

      if (newContacts.length > 0) {
        const updatedSeenContacts = [...new Set([...seenContacts, ...allContactIds])];
        await context.store.put('seen_contacts', updatedSeenContacts.slice(-1000));
      }

      return newContacts;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch contacts: ${error.message}`);
      }
      throw new Error('Failed to fetch contacts');
    }
  },
});
