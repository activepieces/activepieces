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

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `/settlements${queryString}`;

      try {
        const response = await makeRequest(
          auth as string,
          HttpMethod.GET,
          endpoint
        );

        if (response._embedded?.settlements) {
          const settlements = response._embedded.settlements;

          const newSettlements = settlements.filter((settlement: any) => {
            const createdAt = dayjs(settlement.createdAt);
            return createdAt.valueOf() > (lastFetchEpochMS || 0);
          });

          items.push(...newSettlements);

          if (response._links?.next && settlements.length === 250) {
            const lastSettlement = settlements[settlements.length - 1];
            from = lastSettlement.id;

            const allSettlementsOld = settlements.every((settlement: any) => {
              return (
                dayjs(settlement.createdAt).valueOf() <= (lastFetchEpochMS || 0)
              );
            });

            if (allSettlementsOld) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching settlements:', error);
        hasMore = false;
      }
    }

    return items.map((settlement) => ({
      epochMilliSeconds: dayjs(settlement.createdAt).valueOf(),
      data: settlement,
    }));
  },
};

export const newSettlement = createTrigger({
  auth: MollieAuth,
  name: 'newSettlement',
  displayName: 'New Settlement',
  description: 'Fires upon a new settlement event (e.g. payout)',
  props: {},
  sampleData: {
    resource: 'settlement',
    id: 'stl_jDk30akdN',
    reference: '1234567.2404.03',
    status: 'paidout',
    createdAt: '2024-04-31T12:50:14+00:00',
    amount: {
      currency: 'EUR',
      value: '39.75',
    },
    balanceId: 'bal_3kUf4yU2nT',
    periods: {},
    settledAt: '2024-04-06T09:41:44.0Z',
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
        href: 'https://api.mollie.com/v2/invoices/inv_UQgMnkkTFz',
        type: 'application/hal+json',
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
