import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth } from '../../index';
import { makeRequest, meisterTaskCommon } from '../common/common';

const getToken = (auth: any): string => {
  return typeof auth === 'string' ? auth : (auth as any).access_token;
};

const newTaskLabelPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);

    try {
      const tasksResponse = await makeRequest(
        HttpMethod.GET,
        `/task/${propsValue.section}/task_labels`,
        token
      );

      const taskLabels = tasksResponse.body || [];

      return taskLabels.map((label: any) => ({
        epochMilliSeconds: dayjs(label.created_at || label.updated_at || new Date()).valueOf(),
        data: label,
      }));
    } catch (error) {
      console.error('Error fetching task labels:', error);
      return [];
    }
  },
};

export const newTaskLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    "id": 364,
    "label_id": 25,
    "task_id": 123
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newTaskLabelPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newTaskLabelPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newTaskLabelPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newTaskLabelPolling, context);
  },
});