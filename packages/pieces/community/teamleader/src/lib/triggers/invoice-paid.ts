import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const invoicePaid = createTrigger({
  name: 'invoicePaid',
  displayName: 'Invoice Paid',
  description: 'Fires when an Invoice is sent or paid in Teamleader.',
  type: TriggerStrategy.POLLING,
  props: {
    since: Property.DateTime({
      displayName: 'Paid Since',
      required: false,
      description: 'Only fetch invoices paid after this date/time',
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
      url: 'https://api.focus.teamleader.eu/invoices.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: {
          ...(since ? { paid_at: { gte: since } } : {}),
          status: 'paid',
        },
        page: { size: 50 },
      },
    });
    return response.body.data;
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 