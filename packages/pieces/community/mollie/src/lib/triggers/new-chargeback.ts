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

interface MollieChargebackResponse {
  count: number;
  _embedded?: {
    chargebacks?: Array<{
      id: string;
      resource: string;
      mode: string;
      amount: {
        value: string;
        currency: string;
      };
      settlementAmount?: {
        value: string;
        currency: string;
      };
      reason?: string;
      reversedAt?: string;
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
    const chargebacks: Array<{
      id: string;
      resource: string;
      mode: string;
      amount: {
        value: string;
        currency: string;
      };
      settlementAmount?: {
        value: string;
        currency: string;
      };
      reason?: string;
      reversedAt?: string;
      paymentId: string;
      createdAt: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/payments/${paymentId}/chargebacks?limit=${limit}&from=${from}`
        : `/payments/${paymentId}/chargebacks?limit=${limit}`;

      const response = await mollieCommon.makeRequest<MollieChargebackResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.chargebacks ||
        !response._embedded.chargebacks.length
      ) {
        break;
      }

      const items = response._embedded.chargebacks;

      for (const chargeback of items) {
        const createdAt = dayjs(chargeback.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        chargebacks.push(chargeback);
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

    return chargebacks.map((chargeback) => ({
      epochMilliSeconds: dayjs(chargeback.createdAt).valueOf(),
      data: chargeback,
    }));
  },
};

export const mollieNewChargeback = createTrigger({
  auth: mollieAuth,
  name: 'new_chargeback',
  displayName: 'New Payment Chargeback',
  description: 'Fires upon a payment chargeback event',

  type: TriggerStrategy.POLLING,

  props: {
    paymentId: Property.Dropdown({
      displayName: 'Payment ID',
      description: 'The payment to monitor for chargebacks',
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
    resource: 'chargeback',
    id: 'chb_n9z0tp',
    mode: 'live',
    amount: {
      value: '43.38',
      currency: 'USD',
    },
    settlementAmount: {
      value: '37.14',
      currency: 'EUR',
    },
    reason: 'duplicate',
    reversedAt: null,
    paymentId: 'tr_5B8cwPMGnU6qLbRvo7qEZo',
    createdAt: '2018-03-14T17:00:52.0Z',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo/chargebacks/chb_n9z0tp',
        type: 'application/hal+json',
      },
      payment: {
        href: 'https://api.mollie.com/v2/payments/tr_5B8cwPMGnU6qLbRvo7qEZo',
        type: 'application/hal+json',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-chargeback',
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
