import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistReopenTaskAction = createAction({
  auth: todoistAuth,
  name: 'todoist_reopen_task',
  displayName: 'Reopen Task',
  description: 'Uncomplete a previously completed task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reopens a completed Todoist task by task_id, restoring it to the active list (the inverse of Complete Task). Use to undo a completion. Idempotent: reopening an already-active task is a no-op.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the completed task to reopen (obtain from a completed-task list or Get Task).',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    await todoistRestClient.tasks.reopen({ token, task_id });
    return { success: true, task_id };
  },
});
