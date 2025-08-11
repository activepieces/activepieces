import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const mollieNewInvoice = createTrigger({
  auth: mollieAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is created',
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
    id: 'inv_FrvewDA3Pr',
    reference: '2024.10000',
    vatNumber: 'NL123456789B01',
    status: 'open',
    issuedAt: '2024-01-15',
    paidAt: null,
    dueAt: '2024-01-29',
    netAmount: {
      value: '100.00',
      currency: 'EUR',
    },
    vatAmount: {
      value: '21.00',
      currency: 'EUR',
    },
    grossAmount: {
      value: '121.00',
      currency: 'EUR',
    },
    lines: [
      {
        period: '2024-01',
        description: 'Transaction fees',
        count: 100,
        vatPercentage: 21,
        amount: {
          value: '100.00',
          currency: 'EUR',
        },
      },
    ],
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/invoices/inv_FrvewDA3Pr',
        type: 'application/hal+json',
      },
      pdf: {
        href: 'https://www.mollie.com/merchant/download/invoice/FrvewDA3Pr/pdf',
        type: 'application/pdf',
      },
    },
  },
});

const polling: Polling<PiecePropValueSchema<typeof mollieAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await mollieCommon.listResources(
      auth as string,
      'invoices',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );
    
    const items = currentValues._embedded?.invoices || [];
    
    return items.map((invoice: any) => ({
      epochMilliSeconds: new Date(invoice.issuedAt).getTime(),
      data: invoice,
    }));
  },
};