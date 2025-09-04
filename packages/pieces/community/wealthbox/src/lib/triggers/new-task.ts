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
import { wealthBoxAuth } from '../common/constants';
import { wealthboxApiService } from '../common/requests';

const polling: Polling<
  PiecePropValueSchema<typeof wealthBoxAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue, auth }) => {
    const response = await wealthboxApiService.fetchTasks(auth);

    return response.tasks.map((task: any) => ({
      id: task.id,
      data: task,
    }));
  },
};

export const newTask = createTrigger({
  auth: wealthBoxAuth,
  name: 'newTask',
  displayName: 'New Task',
  description: 'Triggers when a new task is created.',
  props: {},
  sampleData: undefined,
  type: TriggerStrategy.POLLING,
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
  async test(context) {
    return await pollingHelper.poll(polling, context);
  },
});
