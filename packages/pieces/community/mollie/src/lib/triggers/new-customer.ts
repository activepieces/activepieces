import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof MollieAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items: any[] = [];
    let hasMore = true;
    let from: string | undefined;

    while (hasMore) {
      const queryParams: string[] = [];

      if (from) {
        queryParams.push(`from=${encodeURIComponent(from)}`);
      }

      queryParams.push('limit=250');
      queryParams.push('sort=asc');

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `/customers${queryString}`;

      try {
        const response = await makeRequest(
          auth as string,
          HttpMethod.GET,
          endpoint
        );

        if (response._embedded?.customers) {
          const customers = response._embedded.customers;

          const newCustomers = customers.filter((customer: any) => {
            const createdAt = dayjs(customer.createdAt);
            return createdAt.valueOf() > (lastFetchEpochMS || 0);
          });

          items.push(...newCustomers);
          if (response._links?.next && customers.length === 250) {
            const lastCustomer = customers[customers.length - 1];
            from = lastCustomer.id;

            const allCustomersOld = customers.every((customer: any) => {
              return (
                dayjs(customer.createdAt).valueOf() <= (lastFetchEpochMS || 0)
              );
            });

            if (allCustomersOld) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        hasMore = false;
      }
    }

    return items.map((customer) => ({
      epochMilliSeconds: dayjs(customer.createdAt).valueOf(),
      data: customer,
    }));
  },
};

export const newCustomer = createTrigger({
  auth: MollieAuth,
  name: 'newCustomer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is created in Mollie',
  props: {},
  sampleData: {
    resource: 'customer',
    id: 'cst_8wmqcHMN4U',
    mode: 'live',
    name: 'John Doe',
    email: 'customer@example.org',
    locale: 'nl_NL',
    metadata: null,
    createdAt: '2023-04-06T13:10:19.0Z',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/customers/cst_8wmqcHMN4U',
        type: 'application/hal+json',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_13514547/customers/cst_tKt44u85MM',
        type: 'text/html',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/v2/customers-api/get-customer',
        type: 'text/html',
      },
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
