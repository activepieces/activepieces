import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
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

interface MollieRefundResponse {
  count: number;
  _embedded?: {
    refunds?: Array<{
      id: string;
      resource: string;
      mode: string;
      description: string;
      amount: {
        value: string;
        currency: string;
      };
      status: string;
      metadata?: Record<string, unknown>;
      paymentId: string;
      createdAt: string;
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
  { paymentId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const apiKey = auth as string;
    const { paymentId } = propsValue;
    const isTest = lastFetchEpochMS === 0;

    let from: string | undefined;
    let hasMorePages = true;
    let stopFetching = false;
    const refunds: Array<{
      id: string;
      resource: string;
      mode: string;
      description: string;
      amount: {
        value: string;
        currency: string;
      };
      status: string;
      metadata?: Record<string, unknown>;
      paymentId: string;
      createdAt: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/payments/${paymentId}/refunds?limit=${limit}&from=${from}`
        : `/payments/${paymentId}/refunds?limit=${limit}`;

      const response = await mollieCommon.makeRequest<MollieRefundResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.refunds ||
        !response._embedded.refunds.length
      ) {
        break;
      }

      const items = response._embedded.refunds;

      for (const refund of items) {
        const createdAt = dayjs(refund.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        refunds.push(refund);
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

    return refunds.map((refund) => ({
      epochMilliSeconds: dayjs(refund.createdAt).valueOf(),
      data: refund,
    }));
  },
};

export const mollieNewRefund = createTrigger({
  auth: mollieAuth,
  name: 'new_refund',
  displayName: 'New Refund',
  description: 'Fires when a payment refund is created',

  type: TriggerStrategy.POLLING,

  props: {
    paymentId: Property.Dropdown({
      displayName: 'Payment ID',
      description: 'The payment to monitor for refunds',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const apiKey = auth as string;
          const response = await mollieCommon.makeRequest(
            apiKey,
            HttpMethod.GET,
            '/payments?limit=250&sort=desc'
          );

          const paymentsResponse = response as {
            _embedded?: {
              payments?: Array<{
                id: string;
                description: string;
                amount: { value: string; currency: string };
                status: string;
                createdAt: string;
              }>;
            };
          };

          if (!paymentsResponse._embedded?.payments) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No payments found',
            };
          }

          const options = paymentsResponse._embedded.payments.map(
            (payment) => ({
              label: `${payment.description || payment.id} - ${
                payment.amount.value
              } ${payment.amount.currency} (${payment.status})`,
              value: payment.id,
            })
          );

          return {
            disabled: false,
            options,
            placeholder: 'Select a payment',
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load payments',
          };
        }
      },
    }),
  },

  sampleData: {
    resource: 'refund',
    id: 're_4qqhO89gsT',
    mode: 'live',
    description: 'Order',
    amount: {
      currency: 'EUR',
      value: '5.95',
    },
    status: 'pending',
    metadata: {
      bookkeeping_id: 12345,
    },
    paymentId: 'tr_5B8cwPMGnU6qLbRvo7qEZo',
    createdAt: '2023-03-14T17:09:02.0Z',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/refunds/re_4qqhO89gsT',
        type: 'application/hal+json',
      },
      payment: {
        href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
        type: 'application/hal+json',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-refund',
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
