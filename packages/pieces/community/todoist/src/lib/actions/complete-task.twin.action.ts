import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistCompleteTaskAiAction = createAction({
  auth: todoistAuth,
  name: 'todoist_complete_task',
  displayName: 'Complete Task',
  description: 'Mark an active task as completed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Closes (completes) an active Todoist task by its task_id. Use once you have the ID (e.g. from Find Task) and want to mark it done; to permanently remove a task instead use Delete Task, and to undo a completion use Reopen Task. Idempotent for non-recurring tasks (re-closing a completed task is a no-op), but each close of a RECURRING task advances it to its next due date, so do not call it twice for one occurrence.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to complete (obtain from Find Task, Filter Tasks, or Get Task).',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    return await todoistRestClient.tasks.close({ token, task_id });
  },
});
