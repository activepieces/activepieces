import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieInput } from '../common/props';
import { moxieCRMAuth } from '../auth';
import { searchContactsActionOutputSchema } from '../output-schemas';

export const moxieSearchContactsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Find contacts by first name, last name or email, or look one up by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie contacts whose first name, last name or email contains the query, or returns the one contact with an exact Contact ID; leave both empty to list every active contact. Each contact carries its clientId (resolve the client with Search Clients by id). Read-only and idempotent.',
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
    id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Exact contact id. When set, the query is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.searchContacts({
      query: moxieInput.text({ value: propsValue.query }),
      id: moxieInput.optionalId({ value: propsValue.id, field: 'Contact ID' }),
    });
  },
});
