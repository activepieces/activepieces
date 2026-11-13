import {
  AppConnectionValueForAuthProperty,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import dayjs from 'dayjs';
import { zohoInvoiceAuth } from '../auth';
import { zohoInvoiceApi } from '../common/api';
import { newInvoiceOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof zohoInvoiceAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const invoices = await zohoInvoiceApi.listInvoices({
      auth,
      lastModifiedAt: dayjs(lastFetchEpochMS).format('YYYY-MM-DD'),
    });
    return invoices.map((item) => ({
      epochMilliSeconds: dayjs(item.created_time).valueOf(),
      data: item,
    }));
  },
};

export const newInvoiceTrigger = createTrigger({
  auth: zohoInvoiceAuth,
  name: 'new_invoice',
  outputSchema: newInvoiceOutputSchema,
  classification: 'READ',
  displayName: 'New Invoice',
  description: 'Trigger when a new invoice is received.',
  aiMetadata: {
    description:
      'Fires when a new invoice is created in Zoho Invoice. Polls periodically for invoices created since the last check and emits each newly created invoice, with the invoice record as the event payload.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, context);
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, context);
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },

  sampleData: {},
});
