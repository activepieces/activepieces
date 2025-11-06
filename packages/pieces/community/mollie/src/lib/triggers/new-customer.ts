import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';
import dayjs from 'dayjs';

interface MollieCustomerResponse {
  count: number;
  _embedded?: {
    customers?: Array<{
      id: string;
      resource: string;
      mode: string;
      name: string;
      email: string;
      locale?: string;
      metadata?: Record<string, unknown>;
      createdAt: string;
      _links?: {
        self?: { href: string; type: string };
        dashboard?: { href: string; type: string };
        documentation?: { href: string; type: string };
      };
    }>;
  };
  _links?: {
    self?: { href: string; type: string };
    previous?: { href: string; type: string };
    next?: { href: string; type: string };
    documentation?: { href: string; type: string };
  };
}

const polling: Polling<
  PiecePropValueSchema<typeof mollieAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth as string;
    const isTest = lastFetchEpochMS === 0;

    let from: string | undefined;
    let hasMorePages = true;
    let stopFetching = false;
    const customers: Array<{
      id: string;
      resource: string;
      mode: string;
      name: string;
      email: string;
      locale?: string;
      metadata?: Record<string, unknown>;
      createdAt: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/customers?sort=desc&limit=${limit}&from=${from}`
        : `/customers?sort=desc&limit=${limit}`;

      const response = await mollieCommon.makeRequest<MollieCustomerResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.customers ||
        !response._embedded.customers.length
      ) {
        break;
      }

      const items = response._embedded.customers;

      for (const customer of items) {
        const createdAt = dayjs(customer.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        customers.push(customer);
      }

      if (stopFetching || isTest) break;

      if (response._links?.next) {
        const nextUrl = new URL(response._links.next.href);
        from = nextUrl.searchParams.get('from') || undefined;
        hasMorePages = true;
      } else {
        hasMorePages = false;
      }
    } while (hasMorePages);

    return customers.map((customer) => ({
      epochMilliSeconds: dayjs(customer.createdAt).valueOf(),
      data: customer,
    }));
  },
};

export const mollieNewCustomer = createTrigger({
  auth: mollieAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is created in Mollie',

  type: TriggerStrategy.POLLING,

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
        href: 'https://www.mollie.com/dashboard/org_13514547/customers/cst_8wmqcHMN4U',
        type: 'text/html',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-customer',
        type: 'text/html',
      },
    },
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
