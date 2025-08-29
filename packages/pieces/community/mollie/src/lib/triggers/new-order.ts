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

interface MollieOrderResponse {
  count: number;
  _embedded?: {
    orders?: Array<{
      id: string;
      resource: string;
      mode: string;
      orderNumber: string;
      amount: {
        value: string;
        currency: string;
      };
      status: string;
      isCancelable: boolean;
      metadata?: Record<string, unknown>;
      createdAt: string;
      expiresAt?: string;
      paidAt?: string;
      authorizedAt?: string;
      canceledAt?: string;
      completedAt?: string;
      billingAddress?: Record<string, unknown>;
      shippingAddress?: Record<string, unknown>;
      redirectUrl?: string;
      webhookUrl?: string;
      locale: string;
      method?: string;
      profileId: string;
      _links?: Record<string, unknown>;
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
    const orders: Array<{
      id: string;
      resource: string;
      mode: string;
      orderNumber: string;
      amount: {
        value: string;
        currency: string;
      };
      status: string;
      isCancelable: boolean;
      metadata?: Record<string, unknown>;
      createdAt: string;
      expiresAt?: string;
      paidAt?: string;
      authorizedAt?: string;
      canceledAt?: string;
      completedAt?: string;
      billingAddress?: Record<string, unknown>;
      shippingAddress?: Record<string, unknown>;
      redirectUrl?: string;
      webhookUrl?: string;
      locale: string;
      method?: string;
      profileId: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/orders?sort=desc&limit=${limit}&from=${from}`
        : `/orders?sort=desc&limit=${limit}`;

      const response = await mollieCommon.makeRequest<MollieOrderResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.orders ||
        !response._embedded.orders.length
      ) {
        break;
      }

      const items = response._embedded.orders;

      for (const order of items) {
        const createdAt = dayjs(order.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        orders.push(order);
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

    return orders.map((order) => ({
      epochMilliSeconds: dayjs(order.createdAt).valueOf(),
      data: order,
    }));
  },
};

export const mollieNewOrder = createTrigger({
  auth: mollieAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Fires when a new order is created in Mollie',

  type: TriggerStrategy.POLLING,

  props: {},

  sampleData: {
    resource: 'order',
    id: 'ord_pbjz8x',
    mode: 'live',
    orderNumber: '18475',
    amount: {
      value: '1027.99',
      currency: 'EUR',
    },
    status: 'created',
    isCancelable: true,
    metadata: {
      order_id: '18475',
    },
    createdAt: '2018-08-02T09:29:56+00:00',
    expiresAt: '2018-08-30T09:29:56+00:00',
    billingAddress: {
      organizationName: 'Organization Name LTD.',
      streetAndNumber: 'Keizersgracht 313',
      postalCode: '1016 EE',
      city: 'Amsterdam',
      country: 'nl',
      givenName: 'Luke',
      familyName: 'Skywalker',
      email: 'luke@skywalker.com',
    },
    shippingAddress: {
      organizationName: 'Organization Name LTD.',
      streetAndNumber: 'Keizersgracht 313',
      postalCode: '1016 EE',
      city: 'Amsterdam',
      country: 'nl',
      givenName: 'Luke',
      familyName: 'Skywalker',
      email: 'luke@skywalker.com',
    },
    locale: 'nl_NL',
    method: 'ideal',
    profileId: 'pfl_URR55HPMGx',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/orders/ord_pbjz8x',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://www.mollie.com/checkout/order/pbjz8x',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/orders/ord_pbjz8x',
        type: 'text/html',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-order',
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
