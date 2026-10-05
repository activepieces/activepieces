import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { searchContactsActionOutputSchema } from '../output-schemas';

export const moxieSearchContactsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_contacts',
  classification: 'READ',
  displayName: 'Search Contacts',
  description: 'Find contacts by first name, last name or email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie contacts by first name, last name or email and returns the matching contact records, including the client each belongs to. Leave the query empty to list every contact. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: searchContactsActionOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Matches a contact first name, last name or email. Leave empty to return every contact.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.searchContacts(propsValue.query);
  },
});
