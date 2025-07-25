import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Deal {
  id: string;
  title: string;
  status?: string;
  value: number;
  company_id?: string;
  created_at?: string;
}

// Action: Create a new deal in Teamleader
export const createDeal = createAction({
  name: 'createDeal',
  displayName: 'Create Deal',
  description: 'Create a new deal in Teamleader.',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    value: Property.Number({ displayName: 'Value', required: true }),
    status: Property.ShortText({ displayName: 'Status', required: false, description: 'Deal status (e.g., open, won, lost).' }),
    companyId: Property.ShortText({ displayName: 'Company ID', required: false, description: 'ID of the related company.' }),
  },
  async run(context) {
    const { title, value, status, companyId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/deals.add`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          title,
          value,
          ...(status ? { status } : {}),
          ...(companyId ? { company_id: companyId } : {}),
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the created deal object
      const deal: Deal = response.body.data;
      return deal;
    } catch (e: unknown) {
      throw new Error(`Failed to create deal: ${(e as Error).message}`);
    }
  },
}); 