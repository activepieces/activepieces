import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const findContact = createAction({
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Finds a contact in Loops by their email address or user ID.',
  audience: 'human',
  outputSchema: loopsSchemas.contactList,
  auth: loopsAuth,
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The field to search by. The Loops API only allows one search parameter.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'User ID', value: 'userId' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Value',
      description: 'The email address or user ID to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { searchBy, searchValue } = context.propsValue;
    const contacts = await loopsClient.findContacts({
      apiKey: context.auth.secret_text,
      queryParams: loopsClient.requireOneIdentifier({ identifyBy: searchBy, value: searchValue }),
    });
    return { contacts, count: contacts.length };
  },
});
