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
import { meisterTaskAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';

const polling: Polling<
  PiecePropValueSchema<typeof meisterTaskAuth>,
  { projectId: string }
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

      const batch = await meisterTaskApiService.fetchSections({
        auth,
        projectId: propsValue.projectId,
        queryString: params.toString()
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

export const newSection = createTrigger({
  auth: meisterTaskAuth,
  name: 'newSection',
  displayName: 'New Section',
  description: 'Triggers when a new section is created',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project (optional)',
      description: 'Choose the project you want to monitor for new sections',
      required: false,
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
