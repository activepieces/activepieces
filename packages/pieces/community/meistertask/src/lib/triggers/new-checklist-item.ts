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
import { taskDropdown } from '../common/props';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';

const polling: Polling<
  PiecePropValueSchema<typeof meisterTaskAuth>,
  { taskId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = [];
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams();
      params.append('items', String(pageSize));
      params.append('page', String(page));

      const batch = await meisterTaskApiService.fetchTaskCheckListItem({
        auth,
        taskId: propsValue.taskId,
        queryString: params.toString(),
      });

      if (!batch.length) break;

      items.push(...batch);
      if (batch.length < pageSize) hasMore = false;
      page += 1;
    }

    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.created_at).valueOf(),
      data: item,
    }));
  },
};

export const newChecklistItem = createTrigger({
  auth: meisterTaskAuth,
  name: 'newChecklistItem',
  displayName: 'New Checklist Item',
  description: 'Triggers when a new checklist item is added to a task',
  props: {
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
  },
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
