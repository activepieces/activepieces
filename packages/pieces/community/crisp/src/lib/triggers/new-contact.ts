import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';

export const newContact = createTrigger({
  auth: crispAuth, 
  name: 'new_contact',
  displayName: 'New Contact Created',
  description: 'Triggers when a new contact is added to Crisp',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Full Profile',
      description: 'Fetch complete contact profile data',
      required: false,
      defaultValue: false
    })
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "email": "customer@example.com",
    "person_id": "person_abc123",
    "created_at": "2023-07-15T10:00:00Z",
    "meta": {
      "nickname": "John Doe"
    }
  },
  onEnable: async (context) => {
    const contacts = await crispClient.listContacts(
      context.auth.access_token,
      context.propsValue.websiteId,
      1
    );
    await context.store.put('lastContactEmail', contacts[0]?.email || '');
  },
  onDisable: async () => {},
  run: async (context) => {
    const lastEmail = (await context.store.get('lastContactEmail')) as string || '';
    const contacts = await crispClient.listContacts(
      context.auth.access_token,
      context.propsValue.websiteId,
      50
    );

    const newContacts = [];
    let stop = false;

    for (const contact of contacts) {
      if (contact.email === lastEmail) {
        stop = true;
        break;
      }
      
      if (context.propsValue.includeMetadata) {
        const fullProfile = await crispClient.getContact(
          context.auth.access_token,
          context.propsValue.websiteId,
          contact.email
        );
        newContacts.push(fullProfile);
      } else {
        newContacts.push(contact);
      }
    }

    if (newContacts.length > 0) {
      await context.store.put('lastContactEmail', newContacts[0].email);
      return newContacts.reverse();
    }
    return [];
  }
});