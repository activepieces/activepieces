import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon, MeisterTaskItem } from '../common/common';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof meistertaskAuth>,
  { project?: string | number; section?: string | number }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getAccessToken(auth);
    let url = '/tasks';
    if (propsValue.section) {
      url = `/sections/${propsValue.section}/tasks`;
    } else if (propsValue.project) {
      url = `/projects/${propsValue.project}/tasks`;
    }

    const response = await makeRequest<MeisterTaskItem[]>(
      HttpMethod.GET,
      url,
      token
    );

    const tasks = Array.isArray(response.body) ? response.body : [];
    const completedTasks = tasks.filter((task) => task.status === 2);

    return completedTasks.map((task) => ({
      epochMilliSeconds: dayjs(task.status_updated_at || task.updated_at || task.created_at).valueOf(),
      data: task,
    }));
  },
};

export const taskCompleted = createTrigger({
  auth: meistertaskAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task is completed.',
  props: {
    project: Property.Dropdown({
      ...meisterTaskCommon.project,
      required: false,
    }),
    section: Property.Dropdown({
      ...meisterTaskCommon.section,
      required: false,
    }),
  },
  sampleData: {
    id: 15,
    token: 'gvuUs17f',
    name: 'Completed Task',
    notes: 'Task details here',
    status: 2,
    status_updated_at: '2023-05-09T14:49:18.303930Z',
    section_id: 1,
    section_name: 'Done',
    project_id: 15,
    sequence: 100,
    assigned_to_id: 1,
    tracked_time: 3600,
    due: null,
    created_at: '2023-02-06T17:01:33.635649Z',
    updated_at: '2023-05-09T14:49:18.304227Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
