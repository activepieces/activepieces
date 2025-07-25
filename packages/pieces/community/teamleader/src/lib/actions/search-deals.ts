import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Deal {
  id: string;
  title: string;
  status: string;
  value?: number;
  created_at?: string;
}

// Action: Search for deals in Teamleader
export const searchDeals = createAction({
  name: 'searchDeals',
  displayName: 'Search Deals',
  description: 'Search for deals in Teamleader.',
  props: {
    query: Property.ShortText({ displayName: 'Query', required: false, description: 'Search term for deal title or customer.' }),
    status: Property.ShortText({ displayName: 'Status', required: false, description: 'Filter by deal status (e.g., open, won, lost).' }),
  },
  async run(context) {
    const { query, status } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/deals.list`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          ...(query ? { filter: { title: { contains: query } } } : {}),
          ...(status ? { filter: { ...(query ? { title: { contains: query } } : {}), status } } : {}),
          page: { size: 50 },
        },
      });
      if (!response.body?.data || !Array.isArray(response.body.data)) {
        throw new Error('Unexpected API response: missing data array');
      }
      // Map output to a clear schema
      return response.body.data.map((deal: Deal) => ({
        id: deal.id,
        title: deal.title,
        status: deal.status,
        value: deal.value,
        created_at: deal.created_at,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to search deals: ${(e as Error).message}`);
    }
  },
}); 