import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDeleteTaskListOutputSchema } from '../../output-schemas';

export const microsoftTodoDeleteTaskListAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_delete_task_list',
  outputSchema: microsoftTodoDeleteTaskListOutputSchema,
  displayName: 'Delete Task List',
  description: 'Permanently delete a task list and all of its tasks.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently delete a Microsoft To Do task list together with every task in it; this cannot be undone. Get the ID from List Task Lists. The built-in "Tasks" and "Flagged email" lists cannot be deleted, and a retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const client = createTodoClient(context.auth);
    await client.api(todoApi.listPath({ listId })).delete();
    return { success: true, listId };
  },
});
