import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { searchClientsActionOutputSchema } from '../output-schemas';

export const moxieSearchClientsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_clients',
  classification: 'READ',
  displayName: 'Search Clients',
  description: 'Find clients by name, contact email or contact full name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie clients by client name (starts with), contact email (starts with) or contact full name (contains), and returns the matching client records with their address, billing terms and contacts. Returns an empty list when nothing matches. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: searchClientsActionOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Matches a client name or contact email that starts with this value, or a contact full name that contains it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.searchClients(propsValue.query);
  },
});
