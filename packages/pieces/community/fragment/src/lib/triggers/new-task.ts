import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient, FragmentTask } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const tasks = await fragmentClient.makeRequest<{ tasks: FragmentTask[] }>(
      HttpMethod.GET,
      '/tasks',
      auth,
      undefined,
      {
        status: 'open',
        limit: '100',
      }
    );

    const items = (tasks.tasks || [])
      .filter((task) => {
        if (!task.created_at) return false;
        const createdAtMs = dayjs(task.created_at).valueOf();
        return createdAtMs >= lastFetchEpochMS;
      })
      .map((task) => ({
        epochMilliSeconds: dayjs(task.created_at).valueOf(),
        data: task,
      }));

    return items;
  },
};

export const newTaskTrigger = createTrigger({
  auth: fragmentAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Fragment',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    uid: 'task_123abc',
    title: 'Sample Task',
    url: 'https://example.com/task/123',
    status: 'open',
    priority: 'medium',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
      files: context.files,
    });
  },
  async test(context) {
    const tasks = await fragmentClient.makeRequest<{ tasks: FragmentTask[] }>(
      HttpMethod.GET,
      '/tasks',
      context.auth,
      undefined,
      {
        status: 'open',
        limit: '5',
      }
    );

    return (tasks.tasks || []).slice(0, 5);
  },
});

