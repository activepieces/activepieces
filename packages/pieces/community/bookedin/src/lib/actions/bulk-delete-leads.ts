import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookedinAuth } from '../../index';
import { BASE_URL, getBookedinHeaders } from '../common/props';

export const bulkDeleteLeads = createAction({
  name: 'bulkDeleteLeads',
  displayName: 'Bulk Delete Leads',
  description: 'Delete multiple leads (max 500 per request)',
  auth: bookedinAuth,
  props: {
    lead_ids: Property.Array({
      displayName: 'Lead IDs',
      description: 'List of Lead IDs to delete (e.g., cus_...)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    // Robust extraction: Handle auth correctly whether it's passed as a string or object
    const apiKey = typeof auth === 'string' 
      ? auth 
      : (auth as any)?.secret_text || (auth as any)?.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/leads/bulk-delete`,
      headers: {
        ...getBookedinHeaders(apiKey as string),
        'Content-Type': 'application/json',
      },
      body: {
        lead_ids: propsValue.lead_ids,
      },
    });

    return response.body;
  },
});