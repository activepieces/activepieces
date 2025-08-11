import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const mollieNewSettlement = createTrigger({
  auth: mollieAuth,
  name: 'new_settlement',
  displayName: 'New Settlement',
  description: 'Triggers when a new settlement is created',
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
    id: 'stl_jDk30akdN',
    reference: '1234567.2401.01',
    createdAt: '2024-01-15T08:00:00+00:00',
    settledAt: '2024-01-15T09:00:00+00:00',
    amount: {
      value: '1000.00',
      currency: 'EUR',
    },
    periods: [
      {
        revenue: [
          {
            description: 'iDEAL',
            count: 10,
            amountNet: {
              value: '1000.00',
              currency: 'EUR',
            },
            amountVat: null,
            amountGross: {
              value: '1000.00',
              currency: 'EUR',
            },
          },
        ],
        costs: [
          {
            description: 'iDEAL',
            count: 10,
            rate: {
              fixed: {
                value: '0.29',
                currency: 'EUR',
              },
              percentage: null,
            },
            amountNet: {
              value: '2.90',
              currency: 'EUR',
            },
            amountVat: {
              value: '0.61',
              currency: 'EUR',
            },
            amountGross: {
              value: '3.51',
              currency: 'EUR',
            },
          },
        ],
      },
    ],
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
    },
  },
});

const polling: Polling<PiecePropValueSchema<typeof mollieAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await mollieCommon.listResources(
      auth as string,
      'settlements',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );
    
    const items = currentValues._embedded?.settlements || [];
    
    return items.map((settlement: any) => ({
      epochMilliSeconds: new Date(settlement.createdAt).getTime(),
      data: settlement,
    }));
  },
};