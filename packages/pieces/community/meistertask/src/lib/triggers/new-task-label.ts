import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';

const newTaskLabelPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);

    try {
      const tasksResponse = await makeRequest(
        HttpMethod.GET,
        `/tasks/${propsValue.section}/task_labels`,
        token
      );

      const taskLabels = Array.isArray(tasksResponse.body) ? tasksResponse.body : [];

      return taskLabels.map((label: any) => ({
        epochMilliSeconds: dayjs(label.created_at || label.updated_at || new Date()).valueOf(),
        data: label,
      }));
    } catch {
      return [];
    }
  },
};

export const newTaskLabel = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a new label is attached to a task.',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    "id": 1,
    "task_id": 15,
    "label_id": 2,
    "created_at": "2023-01-01T00:00:00.000Z"
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
