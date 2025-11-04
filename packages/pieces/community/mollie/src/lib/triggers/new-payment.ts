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

interface MolliePaymentResponse {
  count: number;
  _embedded?: {
    payments?: Array<{
      id: string;
      resource: string;
      mode: string;
      status: string;
      isCancelable: boolean;
      sequenceType: string;
      amount: {
        value: string;
        currency: string;
      };
      description: string;
      method?: string;
      metadata?: Record<string, unknown>;
      details?: Record<string, unknown>;
      profileId: string;
      redirectUrl?: string;
      webhookUrl?: string;
      createdAt: string;
      expiresAt?: string;
      paidAt?: string;
      canceledAt?: string;
      expiredAt?: string;
      failedAt?: string;
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
    const payments: Array<{
      id: string;
      resource: string;
      mode: string;
      status: string;
      isCancelable: boolean;
      sequenceType: string;
      amount: {
        value: string;
        currency: string;
      };
      description: string;
      method?: string;
      metadata?: Record<string, unknown>;
      details?: Record<string, unknown>;
      profileId: string;
      redirectUrl?: string;
      webhookUrl?: string;
      createdAt: string;
      expiresAt?: string;
      paidAt?: string;
      canceledAt?: string;
      expiredAt?: string;
      failedAt?: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/payments?sort=desc&limit=${limit}&from=${from}`
        : `/payments?sort=desc&limit=${limit}`;

      const response = await mollieCommon.makeRequest<MolliePaymentResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.payments ||
        !response._embedded.payments.length
      ) {
        break;
      }

      const items = response._embedded.payments;

      for (const payment of items) {
        const createdAt = dayjs(payment.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        payments.push(payment);
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

    return payments.map((payment) => ({
      epochMilliSeconds: dayjs(payment.createdAt).valueOf(),
      data: payment,
    }));
  },
};

export const mollieNewPayment = createTrigger({
  auth: mollieAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Fires when a new payment is created/received',

  type: TriggerStrategy.POLLING,

  props: {},

  sampleData: {
    resource: 'payment',
    id: 'tr_5B8cwPMGnU6qLbRvo7qEZo',
    mode: 'live',
    status: 'open',
    isCancelable: false,
    sequenceType: 'oneoff',
    amount: {
      value: '75.00',
      currency: 'GBP',
    },
    description: 'Order #12345',
    method: 'ideal',
    metadata: null,
    details: null,
    profileId: 'pfl_QkEhN94Ba',
    redirectUrl: 'https://webshop.example.org/order/12345/',
    createdAt: '2024-02-12T11:58:35.0Z',
    expiresAt: '2024-02-12T12:13:35.0Z',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://www.mollie.com/checkout/issuer/select/ideal/7UhSN1zuXS',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
        type: 'text/html',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-payment',
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
