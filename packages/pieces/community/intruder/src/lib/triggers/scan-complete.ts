import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof intruderAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    const allItems: any[] = [];
    let offset = 0;
    const limit = 25;
    let hasMore = true;

    while (hasMore) {
      const response = await makeRequest(
        auth.secret_text,
        HttpMethod.GET,
        `/scans/?status=completed&limit=${limit}&offset=${offset}`
      );

      const items = response.results || [];

      if (items.length === 0) {
        hasMore = false;
      } else {
        allItems.push(...items);
        offset += limit;

        if (!response.next) {
          hasMore = false;
        }
      }
    }

    return allItems
      .filter((item: any) => {
        const createdTime = dayjs(item.created_at).valueOf();
        return createdTime > lastFetchEpochMS;
      })
      .map((item: any) => ({
        epochMilliSeconds: dayjs(item.created_at).valueOf(),
        data: item,
      }));
  },
};

export const scanComplete = createTrigger({
  auth: intruderAuth,
  name: 'scanComplete',
  displayName: 'Scan Complete',
  description: 'Trigger when a scan is completed',
  props: {},
  sampleData: {
    id: 1,
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z',
    scan_type: 'assessment_schedule',
    schedule_period: 'monthly',
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
