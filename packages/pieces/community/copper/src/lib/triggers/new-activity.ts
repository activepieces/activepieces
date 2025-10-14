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
import dayjs from 'dayjs';
import { CopperActivity, CopperAuth, CopperAuthType } from '../common/constants';
import { CopperApiService } from '../common/requests';

const polling: Polling<
  CopperAuthType,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,

  items: async ({ auth, lastFetchEpochMS }) => {
    const minCreatedUnix =
      lastFetchEpochMS != null
        ? Math.max(0, Math.floor(lastFetchEpochMS / 1000) - 1)
        : undefined;

    const collected: CopperActivity[] = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const batch = await CopperApiService.fetchActivities(auth, {
        minimum_activity_date: minCreatedUnix,
        page_size: pageSize,
        page_number: page,
      });
      if (!batch.length) break;

      collected.push(...batch);
      if (batch.length < pageSize) hasMore=false;
      page += 1;
    }

    const out = collected.map((a) => ({
      epochMilliSeconds: (a.activity_date ?? 0) * 1000,
      data: a,
    }));

    out.sort((a, b) => a.epochMilliSeconds - b.epochMilliSeconds);
    return out;
  },
};

export const newActivity = createTrigger({
  auth: CopperAuth,
  name: 'newActivity',
  displayName: 'New Activity',
  description: 'Triggers when a new activity is logged',
  props: {},
  sampleData: {},
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
