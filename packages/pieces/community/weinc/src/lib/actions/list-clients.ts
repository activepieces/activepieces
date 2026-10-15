import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { weincRequest, WeincClient } from '../common/client';

export const listClients = createAction({
  auth: weincAuth,
  name: 'list_clients',
  displayName: 'List Clients',
  description: 'Lists the clients in your organization.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every client of the WeInc organization with id, email, name, company, status and plan. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const res = await weincRequest<{ clients: WeincClient[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/clients',
    });
    return res.clients;
  },
});
