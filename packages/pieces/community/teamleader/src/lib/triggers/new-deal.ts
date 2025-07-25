import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Deal {
  id: string;
  title: string;
  status: string;
  created_at: string;
  value?: number;
}

// Trigger: Fires when a new deal is added in Teamleader
export const newDeal = createTrigger({
  name: 'newDeal',
  displayName: 'New Deal',
  description: 'Fires when a new deal is added in Teamleader.',
  type: TriggerStrategy.POLLING,
  props: {
    since: Property.DateTime({
      displayName: 'Created Since',
      required: false,
      description: 'Only fetch deals created after this date/time',
    }),
  },
  sampleData: {
    id: '33333',
    title: 'New Opportunity',
    status: 'open',
    created_at: '2024-01-01T12:00:00Z',
    value: 5000,
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
        url: `${apiBase}/deals.list`,
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
      return response.body.data.map((deal: Deal) => ({
        id: deal.id,
        title: deal.title,
        status: deal.status,
        created_at: deal.created_at,
        value: deal.value,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to fetch deals: ${(e as Error).message}`);
    }
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 