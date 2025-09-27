import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTask } from '@microsoft/microsoft-graph-types';

const fetchCompletedTasks = async (
  client: Client,
  taskListId: string
): Promise<TodoTask[]> => {
  const tasks: TodoTask[] = [];
  let response: PageCollection = await client
    .api(`/me/todo/lists/${taskListId}/tasks?$filter=status eq 'completed'`)
    .get();
  while (response.value.length > 0) {
    tasks.push(...(response.value as TodoTask[]));
    if (response['@odata.nextLink']) {
      response = await client.api(response['@odata.nextLink']).get();
    } else {
      break;
    }
  }
  return tasks;
};

export const taskCompletedTrigger = createTrigger({
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task is completed.',
  auth: microsoftToDoAuth,
  props: {
    task_list_id: Property.Dropdown({
      displayName: 'Task List',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!(auth as OAuth2PropertyValue)?.access_token) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        return await getTaskListsDropdown(auth as OAuth2PropertyValue);
      },
    }),
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const initialTasks = await fetchCompletedTasks(
      client,
      context.propsValue.task_list_id
    );
    const taskIds = initialTasks.map((task) => task.id);
    await context.store.put('completed_task_ids', taskIds);
  },

  async onDisable(context) {
    await context.store.put('completed_task_ids', []);
  },

  async run(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const oldTaskIds =
      (await context.store.get<string[]>('completed_task_ids')) ?? [];
    const oldTaskIdsSet = new Set(oldTaskIds);
    const currentTasks = await fetchCompletedTasks(
      client,
      context.propsValue.task_list_id
    );
    const newTasks = currentTasks.filter(
      (task) => task.id && !oldTaskIdsSet.has(task.id)
    );
    if (newTasks.length > 0) {
      const currentTaskIds = currentTasks.map((task) => task.id);
      await context.store.put('completed_task_ids', currentTaskIds);
    }
    return newTasks;
  },

  async test(context) {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const tasks = await fetchCompletedTasks(
      client,
      context.propsValue.task_list_id
    );
    return tasks.slice(-5);
  },

  sampleData: {
    '@odata.etag': 'W/"vVwdQvxCiE6779iYhchMrAAGgwrltg=="',
    importance: 'normal',
    isReminderOn: false,
    status: 'completed',
    title: 'Test Task',
    createdDateTime: '2025-05-08T14:05:53.4572708Z',
    lastModifiedDateTime: '2025-05-08T14:41:50.2593794Z',
    completedDateTime: {
      dateTime: '2025-05-08T14:41:50.0000000',
      timeZone: 'UTC',
    },
    id: 'AQMkADAwATM3ZmYAZS0xNGVmLWNiZmYALTAwAi0wMAoARgAAAw8tTPoZEYtLvE5mK48wuvIHAL1cHUL8QohOu_-YmIXITKwABoMc598AAAC9XB1C-EKITrvv2JiFyEysAAaDHUmqAAAA',
    body: { content: '', contentType: 'text' },
  },
});
