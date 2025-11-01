import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';
import { taskDropdown } from '../common/props';

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
      const batch = await meisterTaskApiService.fetchAttachments({
        auth,
        taskId: propsValue.taskId,
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

export const newAttachment = createTrigger({
  auth: meisterTaskAuth,
  name: 'newAttachment',
  displayName: 'New Attachment',
  description: 'Triggers when an attachment is created',
  props: {
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'An attachment belongs to a task.',
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
