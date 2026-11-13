import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDeleteTaskOutputSchema } from '../../output-schemas';

export const microsoftTodoDeleteTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_delete_task',
  outputSchema: microsoftTodoDeleteTaskOutputSchema,
  displayName: 'Delete Task',
  description: 'Permanently delete a task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently delete a Microsoft To Do task with its checklist items, links and attachments; this cannot be undone. Identify it by list ID and task ID from List Tasks. Prefer Complete Task when the work is done. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const taskId = context.propsValue.task_id.trim();
    const client = createTodoClient(context.auth);
    await client.api(todoApi.taskPath({ listId, taskId })).delete();
    return { success: true, listId, taskId };
  },
});
