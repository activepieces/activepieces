import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Company {
  id: string;
  name: string;
  vat_number: string;
  created_at: string;
  website?: string;
}

// Trigger: Fires when a new Company is added in Teamleader
export const newCompany = createTrigger({
  name: 'newCompany',
  displayName: 'New Company',
  description: 'Fires when a new Company is added in Teamleader.',
  type: TriggerStrategy.POLLING,
  props: {
    since: Property.DateTime({
      displayName: 'Created Since',
      required: false,
      description: 'Only fetch companies created after this date/time',
    }),
  },
  sampleData: {
    id: '123456',
    name: 'Acme Corp',
    vat_number: 'BE0123456789',
    created_at: '2024-01-01T12:00:00Z',
    website: 'https://acme.com',
  },
  // Required by interface, intentionally left empty for framework compliance
  async onEnable(): Promise<void> { /* intentionally empty */ },
  async onDisable(): Promise<void> { /* intentionally empty */ },
  async run(context) {
    const since = context.propsValue.since;
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
          ...(since ? { filter: { created_at: { gte: since } } } : {}),
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
        created_at: company.created_at,
        website: company.website,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to fetch companies: ${(e as Error).message}`);
    }
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 