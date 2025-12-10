import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
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

const newTaskPolling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/tasks`,
      token
    );

    const tasks = response.body || [];
    return tasks.map((task: any) => ({
      epochMilliSeconds: dayjs(task.updated_at).valueOf(),
      data: task,
    }));
  },
};

export const newTask = createTrigger({
  auth: meistertaskAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a task is created or changed.',
  props: {
  },
  sampleData: {
    "id": 15,
    "token": "gvuUs17f",
    "name": "Task Name",
    "notes": "Here are some task notes",
    "status": 1,
    "status_updated_at": "2019-05-09T14:49:18.303930Z",
    "section_id": 1,
    "section_name": "Open",
    "project_id": 15,
    "sequence": 100,
    "assigned_to_id": 1,
    "tracked_time": 3600,
    "due": null,
    "created_at": "2019-02-06T17:01:33.635649Z",
    "updated_at": "2019-05-09T14:49:18.304227Z"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(newTaskPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newTaskPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newTaskPolling, context);
  },
  async run(context) {
    return await pollingHelper.poll(newTaskPolling, context);
  },
});