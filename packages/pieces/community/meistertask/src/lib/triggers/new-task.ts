import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
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
  PiecePropValueSchema<typeof meistertaskAuth>,
  { project: unknown; section: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const token = getToken(auth);
    const response = await makeRequest(
      HttpMethod.GET,
      `/sections/${propsValue.section}/tasks`,
      token
    );

    const tasks = response.body || [];
    return tasks.map((task: any) => ({
      epochMilliSeconds: dayjs(task.updated_at || task.created_at).valueOf(),
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
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
  },
  sampleData: {
    id: 12345678,
    name: 'Sample Task',
    notes: 'This is a sample task description',
    status: 1,
    section_id: 87654321,
    project_id: 11223344,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
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