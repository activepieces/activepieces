import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Deal {
  id: string;
  title: string;
  status?: string;
  value?: number;
  company_id?: string;
  created_at?: string;
}

// Action: Update a deal in Teamleader
export const updateDeal = createAction({
  name: 'updateDeal',
  displayName: 'Update Deal',
  description: 'Update an existing deal in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Deal ID', required: true, description: 'The ID of the deal to update.' }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false, description: 'Deal status (e.g., open, won, lost).' }),
    value: Property.Number({ displayName: 'Value', required: false }),
  },
  async run(context) {
    const { id, title, status, value } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/deals.update`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          id,
          ...(title ? { title } : {}),
          ...(status ? { status } : {}),
          ...(value !== undefined ? { value } : {}),
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the updated deal object
      const deal: Deal = response.body.data;
      return deal;
    } catch (e: unknown) {
      throw new Error(`Failed to update deal: ${(e as Error).message}`);
    }
  },
}); 