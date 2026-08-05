import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistDeleteTaskAction = createAction({
  auth: todoistAuth,
  name: 'todoist_delete_task',
  displayName: 'Delete Task',
  description: 'Permanently delete a task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a Todoist task (and its sub-tasks) by task_id. This is destructive and not recoverable via the API — prefer Complete Task when the work is simply done, since completing preserves history. Resolve the ID via Find Task or Filter Tasks first. Idempotent: deleting an already-deleted task is treated as success.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to delete (obtain from Find Task, Filter Tasks, or Get Task).',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    try {
      await todoistRestClient.tasks.delete({ token, task_id });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: true, task_id, already_deleted: true };
      }
      throw error;
    }

    return { success: true, task_id };
  },
});
