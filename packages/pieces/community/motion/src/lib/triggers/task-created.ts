import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
  QueryParams,
} from '@activepieces/pieces-common';
import { BASE_URL, workspaceId } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof motionAuth>,
  { workspaceId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const result = [];

    let nextCursor: string | undefined;

    const qs: QueryParams = {
      workspaceId: propsValue.workspaceId,
    };

    do {
      if (nextCursor) {
        qs['cursor'] = nextCursor;
      }

      const response = await httpClient.sendRequest<{
        tasks: { id: string; name: string; createdTime: string }[];
        meta: { pageSize: number; nextCursor?: string };
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/tasks`,
        headers: {
          'X-API-Key': auth as string,
        },
        queryParams: qs,
      });

      const tasks = response.body.tasks ?? [];
      result.push(...tasks);

      nextCursor = response.body.meta.nextCursor;
    } while (nextCursor);

    return result.map((task) => {
      return {
        epochMilliSeconds: dayjs(task.createdTime).valueOf(),
        data: task,
      };
    });
  },
};

export const taskCreated = createTrigger({
  auth: motionAuth,
  name: 'task-created',
  displayName: 'Task Created',
  description: 'Triggers when a new task is created.',
  type: TriggerStrategy.POLLING,
  props: {
    workspaceId: workspaceId('Workspace ID'),
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'task_123',
    name: 'Sample Task',
    description: 'This is a sample task',
    duration: 60,
    dueDate: '2024-03-20T15:00:00Z',
    deadlineType: 'HARD',
    completed: false,
    creator: {
      id: 'user_123',
      name: 'John Doe',
      email: 'john@example.com',
    },
    workspace: {
      id: 'workspace_123',
      name: 'My Workspace',
    },
    status: {
      name: 'In Progress',
      isDefaultStatus: false,
      isResolvedStatus: false,
    },
    priority: 'HIGH',
    labels: [{ name: 'Important' }, { name: 'Urgent' }],
    assignees: [
      {
        id: 'user_456',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ],
    createdTime: '2024-03-19T10:00:00Z',
    updatedTime: '2024-03-19T10:00:00Z',
  },
});
