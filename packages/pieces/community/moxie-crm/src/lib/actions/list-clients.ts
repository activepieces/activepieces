import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { listClientsActionOutputSchema } from '../output-schemas';

export const moxieListClientsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_clients',
  classification: 'READ',
  displayName: 'List Clients',
  description: 'Retrieve every client and prospect in the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns all clients and prospects in the Moxie workspace. Use to find a client id or name before creating a project, task or invoice against it. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listClientsActionOutputSchema,
  props: {},
  async run({ auth }) {
    const client = await makeClient(auth);
    return await client.listClients();
  },
});
