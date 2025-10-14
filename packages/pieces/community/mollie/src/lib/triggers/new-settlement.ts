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

interface MollieSettlementResponse {
  count: number;
  _embedded?: {
    settlements?: Array<{
      id: string;
      resource: string;
      reference: string;
      createdAt: string;
      settledAt?: string;
      status: string;
      amount: {
        value: string;
        currency: string;
      };
      periods: Record<string, unknown>;
      invoiceId?: string;
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
    const settlements: Array<{
      id: string;
      resource: string;
      reference: string;
      createdAt: string;
      settledAt?: string;
      status: string;
      amount: {
        value: string;
        currency: string;
      };
      periods: Record<string, unknown>;
      invoiceId?: string;
      _links?: Record<string, unknown>;
    }> = [];

    do {
      const limit = isTest ? 10 : 250;
      const url = from
        ? `/settlements?limit=${limit}&from=${from}`
        : `/settlements?limit=${limit}`;

      const response = await mollieCommon.makeRequest<MollieSettlementResponse>(
        apiKey,
        HttpMethod.GET,
        url
      );

      if (
        !response._embedded ||
        !response._embedded.settlements ||
        !response._embedded.settlements.length
      ) {
        break;
      }

      const items = response._embedded.settlements;

      for (const settlement of items) {
        const createdAt = dayjs(settlement.createdAt).valueOf();

        if (createdAt < lastFetchEpochMS) {
          stopFetching = true;
          break;
        }

        settlements.push(settlement);
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

    return settlements.map((settlement) => ({
      epochMilliSeconds: dayjs(settlement.createdAt).valueOf(),
      data: settlement,
    }));
  },
};

export const mollieNewSettlement = createTrigger({
  auth: mollieAuth,
  name: 'new_settlement',
  displayName: 'New Settlement',
  description: 'Fires upon a new settlement event (e.g. payout)',

  type: TriggerStrategy.POLLING,

  props: {},

  sampleData: {
    resource: 'settlement',
    id: 'stl_jDk30akdN',
    reference: '1234567.1804.03',
    createdAt: '2018-04-06T06:00:01.0Z',
    settledAt: '2018-04-06T09:41:44.0Z',
    status: 'paidout',
    amount: {
      value: '39.75',
      currency: 'EUR',
    },
    periods: {
      '2018': {
        '04': {
          revenue: [
            {
              description: 'iDEAL',
              method: 'ideal',
              count: 6,
              amountNet: {
                value: '86.1000',
                currency: 'EUR',
              },
              amountVat: null,
              amountGross: {
                value: '86.1000',
                currency: 'EUR',
              },
            },
          ],
          costs: [
            {
              description: 'iDEAL',
              method: 'ideal',
              count: 6,
              rate: {
                fixed: {
                  value: '0.3500',
                  currency: 'EUR',
                },
                percentage: null,
              },
              amountNet: {
                value: '2.1000',
                currency: 'EUR',
              },
              amountVat: {
                value: '0.4410',
                currency: 'EUR',
              },
              amountGross: {
                value: '2.5410',
                currency: 'EUR',
              },
            },
          ],
        },
      },
    },
    invoiceId: 'inv_FrvewDA3Pr',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN',
        type: 'application/hal+json',
      },
      payments: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN/payments',
        type: 'application/hal+json',
      },
      refunds: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN/refunds',
        type: 'application/hal+json',
      },
      chargebacks: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN/chargebacks',
        type: 'application/hal+json',
      },
      captures: {
        href: 'https://api.mollie.com/v2/settlements/stl_jDk30akdN/captures',
        type: 'application/hal+json',
      },
      invoice: {
        href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr',
        type: 'application/hal+json',
      },
      documentation: {
        href: 'https://docs.mollie.com/reference/get-settlement',
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
