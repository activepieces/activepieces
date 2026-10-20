import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const listClients = createAction({
  auth: gotifyAuth,
  name: 'list_clients',
  classification: 'SEARCH',
  displayName: 'List Clients',
  description: 'List the clients (devices) of the connected Gotify user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Gotify clients (phones, browsers, integrations that receive messages) of the connected user with id, name and lastUsed. Client tokens are not returned. Needs the Client Token. Read-only.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.listClients,
  props: {},
  async run({ auth }) {
    const body = await gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/client', tokenKind: 'client' });
    const clients = gotifyClient.arrayOf(body).map((client) => gotifyClient.withoutToken(client));
    return { clients, count: clients.length };
  },
});
