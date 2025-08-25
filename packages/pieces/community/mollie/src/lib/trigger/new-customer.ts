import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

export const mollieNewCustomer = createTrigger({
  auth: mollieAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created',
  props: {},
  type: TriggerStrategy.POLLING,
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
  sampleData: {
    id: 'cst_kEn1PlbGa',
    mode: 'test',
    name: 'John Doe',
    email: 'john@example.com',
    locale: 'en_US',
    metadata: {
      customer_id: '12345',
    },
    createdAt: '2024-01-15T12:00:00+00:00',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/customers/cst_kEn1PlbGa',
        type: 'application/hal+json',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/customers/cst_kEn1PlbGa',
        type: 'text/html',
      },
    },
  },
});

const polling: Polling<
  PiecePropValueSchema<typeof mollieAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await mollieCommon.listResources(
      auth as string,
      'customers',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );

    const items = currentValues._embedded?.customers || [];

    return items.map((customer: any) => ({
      epochMilliSeconds: new Date(customer.createdAt).getTime(),
      data: customer,
    }));
  },
};
