import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { listListsOutputSchema } from '../output-schemas';

export const listListsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'list_lists',
  classification: 'SEARCH',
  displayName: 'List Lists',
  description: 'Returns all subscriber lists of a client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns every subscriber list (ID and name) that belongs to one Campaign Monitor client. Choose this to discover list IDs before adding, finding or listing subscribers. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listListsOutputSchema,
  props: {
    clientId: clientId,
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest<{ ListID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${propsValue.clientId}/lists.json`,
    });
    return response.body;
  },
});
