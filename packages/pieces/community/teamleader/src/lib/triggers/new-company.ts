import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

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
  sampleData: {},
  async onEnable() { /* Required by interface. No setup needed. */ },
  async onDisable() { /* Required by interface. No teardown needed. */ },
  async run(context) {
    const since = context.propsValue.since;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/companies.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        ...(since ? { filter: { created_at: { gte: since } } } : {}),
        page: { size: 50 },
      },
    });
    return response.body.data;
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 