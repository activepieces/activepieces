import { todoistAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistRestClient } from '../common/client/rest-client';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';

export const todoistFindTaskAiAction = createAction({
  auth: todoistAuth,
  name: 'todoist_find_task',
  displayName: 'Find Task',
  description: 'Find an active task by its exact name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up a single active Todoist task by exact content match, optionally scoped to one project (all projects if blank). Use to resolve a known task name to its full record and ID before updating, moving, completing, or deleting it. For querying by date/priority/label or returning many matches, use Filter Tasks instead. Read-only and idempotent; errors if no task matches exactly.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the task to search for.',
      required: true,
    }),
    project_id: todoistProjectIdDropdown(
      'Search for tasks within the selected project. If left blank, then all projects are searched.',
    ),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { name, project_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    const tasks = await todoistRestClient.tasks.list({ token, project_id });

    const matchedTask = tasks.find((task) => task.content == name);
    if (!matchedTask) {
      throw new Error('Task not found');
    } else {
      return matchedTask;
    }
  },
});
