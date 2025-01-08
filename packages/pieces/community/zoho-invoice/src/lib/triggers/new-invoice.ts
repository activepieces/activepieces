import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import { common } from '../common';

import dayjs from 'dayjs';
import { zohoAuth } from '../..';

const polling: Polling<
  PiecePropValueSchema<typeof zohoAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getInvoices(auth, {
        createdSince: dayjs(lastFetchEpochMS).format('YYYY-MM-DD'),
      })) ?? [];
    const items = (currentValues as any[]).map(
      (item: { created_time: string }) => ({
        epochMilliSeconds: dayjs(item.created_time).valueOf(),
        data: item,
      })
    );
    return items;
  },
};

export const newInvoice = createTrigger({
  auth: zohoAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Trigger when a new invoice is received.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  sampleData: {},
});
