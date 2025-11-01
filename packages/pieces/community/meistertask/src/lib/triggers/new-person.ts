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
      const batch = await meisterTaskApiService.fetchPersons({
        auth,
        projectId: propsValue.projectId,
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

export const newPerson = createTrigger({
  auth: meisterTaskAuth,
  name: 'newPerson',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project',
  props: {
    projectId: projectDropdown({
      displayName: 'Select Project (optional)',
      description: 'Choose the project you want to monitor for new persons',
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
