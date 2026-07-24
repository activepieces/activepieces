import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistGetTaskAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_task',
  displayName: 'Get Task',
  description: 'Fetch a single task by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the full current record of one Todoist task by its task_id. Use when you already have an ID (e.g. from a trigger or webhook payload) and need the task\'s up-to-date state. To find a task whose ID you do not yet know, use Find Task or Filter Tasks. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to fetch (e.g. from a trigger payload, Find Task, or Filter Tasks).',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    return await todoistRestClient.tasks.get({ token, task_id });
  },
});
