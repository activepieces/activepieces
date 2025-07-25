import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Company {
  id: string;
  name: string;
  vat_number?: string;
  website?: string;
  created_at?: string;
}

// Action: Search for companies in Teamleader
export const searchCompanies = createAction({
  name: 'searchCompanies',
  displayName: 'Search Companies',
  description: 'Search for companies in Teamleader.',
  props: {
    query: Property.ShortText({ displayName: 'Query', required: false, description: 'Search term for company name or VAT number.' }),
    vatNumber: Property.ShortText({ displayName: 'VAT Number', required: false, description: 'Filter by VAT number.' }),
  },
  async run(context) {
    const { query, vatNumber } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/companies.list`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          ...(query ? { filter: { name: { contains: query } } } : {}),
          ...(vatNumber ? { filter: { ...(query ? { name: { contains: query } } : {}), vat_number: vatNumber } } : {}),
          page: { size: 50 },
        },
      });
      if (!response.body?.data || !Array.isArray(response.body.data)) {
        throw new Error('Unexpected API response: missing data array');
      }
      // Map output to a clear schema
      return response.body.data.map((company: Company) => ({
        id: company.id,
        name: company.name,
        vat_number: company.vat_number,
        website: company.website,
        created_at: company.created_at,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to search companies: ${(e as Error).message}`);
    }
  },
}); 