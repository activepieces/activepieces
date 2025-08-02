import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';
import dayjs from 'dayjs';

const polling: Polling<any, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined;
    const params: Record<string, any> = {
      sortField: 'createdAt',
      sortOrder: 'desc',
    };
    if (since) params['query'] = `(createdAt:[${since} TO *])`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/customers',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    const customers = response.body._embedded?.customers || [];
    return customers.map((customer: any) => ({
      epochMilliSeconds: new Date(customer.createdAt).getTime(),
      data: customer,
    }));
  },
};

export const newCustomer = createTrigger({
  auth: helpScoutAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is added in Help Scout.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
}); 