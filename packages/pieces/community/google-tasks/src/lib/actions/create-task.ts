import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, Task, TaskStatus } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksCreateTaskAction = createAction({
  auth: googleTasksAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description:
    'Create a new task in a task list, optionally as a subtask and/or positioned after a sibling.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new task in a task list, optionally as a subtask of a parent task (parent_task_id) and/or positioned after a sibling (previous_task_id); resolve those ids via Find Tasks. Use to add a single to-do; for marking an existing task done use Mark Task Complete. Not idempotent — each call creates a separate task.',
    idempotent: false,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    title: googleTasksCommon.title,
    notes: googleTasksCommon.notes,
    due_date: googleTasksCommon.due,
    parent_task_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description:
        'Make this a subtask of the task with this id (must be in the same list). Obtain the id from Find Tasks. Omit to create a top-level task.',
      required: false,
    }),
    previous_task_id: Property.ShortText({
      displayName: 'Previous Task ID',
      description:
        'Place the new task immediately after the sibling with this id. Obtain the id from Find Tasks. Omit to place it first among its siblings.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { tasks_list, title, notes, due_date, parent_task_id, previous_task_id } =
      propsValue;

    const task: Task = {
      kind: 'tasks#task',
      status: TaskStatus.NEEDS_ACTION,
      title,
      notes,
      due: due_date
        ? `${new Date(due_date).toISOString().split('T')[0]}T00:00:00Z`
        : undefined,
    };

    // parent / previous are QUERY params on tasks.insert, NOT body fields.
    const queryParams: Record<string, string> = {};
    if (parent_task_id) {
      queryParams['parent'] = parent_task_id;
    }
    if (previous_task_id) {
      queryParams['previous'] = previous_task_id;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${tasks_list}/tasks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      body: task,
      queryParams,
    };

    const response = await httpClient.sendRequest<Task>(request);

    return response.body;
  },
});
