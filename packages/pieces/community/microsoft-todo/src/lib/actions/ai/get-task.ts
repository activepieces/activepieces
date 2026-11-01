import { createAction } from '@activepieces/pieces-framework';
import { TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskOutputSchema } from '../../output-schemas';

export const microsoftTodoGetTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_task',
  outputSchema: taskOutputSchema,
  displayName: 'Get Task',
  description: 'Get one task by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read one Microsoft To Do task (title, notes, status, importance, dates, categories, recurrence) by its list ID and task ID. Use List Tasks first when you only know the title. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const { list_id, task_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const task: TodoTask = await client.api(todoApi.taskPath({ listId: list_id, taskId: task_id })).get();
    return todoApi.toTask(task);
  },
});
