import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL } from '../common';

interface Customer {
  id: number;
  vatNumber: string | null;
  name: string | null;
  defaultRate: number | null;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof timeOpsAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<Customer[]>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/Customers`,
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    const customers = response.body ?? [];

    return customers
      .sort((a, b) => b.id - a.id)
      .map((customer) => ({
        id: customer.id,
        data: customer,
      }));
  },
};

export const newCustomer = createTrigger({
  auth: timeOpsAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 1,
    vatNumber: 'DK12345678',
    name: 'Example Customer',
    defaultRate: 100,
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
