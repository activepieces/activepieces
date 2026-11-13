import { createAction } from '@activepieces/pieces-framework';
import { TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskOutputSchema } from '../../output-schemas';

export const microsoftTodoCompleteTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_complete_task',
  outputSchema: taskOutputSchema,
  displayName: 'Complete Task',
  description: 'Mark a task as completed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Mark a Microsoft To Do task as completed, identified by list ID and task ID (from List Tasks); To Do records the completion time. To reopen a task, use Update Task with status Not Started. Completing an already completed task keeps it completed.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const { list_id, task_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const task: TodoTask = await client
      .api(todoApi.taskPath({ listId: list_id, taskId: task_id }))
      .update({ status: 'completed' });
    return todoApi.toTask(task);
  },
});
