import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { listClientsOutputSchema } from '../output-schemas';

export const listClientsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'list_clients',
  classification: 'SEARCH',
  displayName: 'List Clients',
  description: 'Returns all clients in your Campaign Monitor account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns every client (ID and name) in the connected Campaign Monitor account. Choose this first to discover the client ID that List Lists, List Sent Campaigns, Send Smart Transactional Email and the subscriber actions need. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listClientsOutputSchema,
  props: {},
  async run({ auth }) {
    const response = await makeRequest<{ ClientID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: '/clients.json',
    });
    return response.body;
  },
});
