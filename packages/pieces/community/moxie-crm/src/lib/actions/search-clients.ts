import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieInput } from '../common/props';
import { moxieCRMAuth } from '../auth';
import { searchClientsActionOutputSchema } from '../output-schemas';

export const moxieSearchClientsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_clients',
  classification: 'SEARCH',
  displayName: 'Search Clients',
  description: 'Find clients by name, phone, contact email or contact name, or look one up by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie clients by client name or phone (starts with), contact email or phone (starts with) or contact full name (contains), or returns the one client with an exact Client ID. Use to resolve a client id or exact client name before creating projects, tasks, invoices or contacts for it. Returns an empty list when nothing matches. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: searchClientsActionOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Matches a client name, client phone, contact email or contact phone that starts with this value, or a contact full name that contains it.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Client ID',
      description: 'Exact client id. When set, the query is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, id } = moxieInput.queryOrId({ query: propsValue.query, id: propsValue.id, idField: 'Client ID' });
    const client = await makeClient(auth);
    return await client.searchClients({ query, id });
  },
});
