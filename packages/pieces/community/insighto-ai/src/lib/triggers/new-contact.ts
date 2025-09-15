import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ContactItemSchema, ContactItem } from '../schemas';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to start checking from',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of contacts to check per page (max 100)',
      required: false,
      defaultValue: 50,
    }),
  },
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
    const apiKey = context.auth as string;
    const page = context.propsValue['page'] || 1;
    const size = context.propsValue['size'] || 50;

    const url = `https://api.insighto.ai/api/v1/contact`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
      page: page.toString(),
      size: size.toString(),
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

    // Validate contact items
    const validatedContacts = data.items.map((contact: any) => {
      try {
        return ContactItemSchema.parse(contact);
      } catch (error) {
        console.warn('Invalid contact item:', contact, error);
        return null;
      }
    }).filter(Boolean) as ContactItem[];

    // Get previously seen contact IDs
    const seenContacts = (await context.store.get<string[]>('seen_contacts')) || [];

    // Find new contacts that haven't been seen before
    const newContacts: ContactItem[] = [];
    const currentContactIds: string[] = [];

    for (const contact of validatedContacts) {
      const contactId = contact.id;
      currentContactIds.push(contactId);

      if (!seenContacts.includes(contactId)) {
        newContacts.push(contact);
      }
    }

    // Update the store with all current contact IDs (to avoid processing old contacts again)
    await context.store.put('seen_contacts', currentContactIds);

    return newContacts;
  },
});
