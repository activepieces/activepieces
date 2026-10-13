import { createAction } from '@activepieces/pieces-framework';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskListOutputSchema } from '../../output-schemas';

export const microsoftTodoGetTaskListAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_task_list',
  outputSchema: taskListOutputSchema,
  displayName: 'Get Task List',
  description: 'Get one task list by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read one Microsoft To Do task list (name, owner and sharing flags, built-in list type) by its ID from List Task Lists. Use List Task Lists instead when you only know the name. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
  },
  async run(context) {
    const client = createTodoClient(context.auth);
    const list: TodoTaskList = await client.api(todoApi.listPath({ listId: context.propsValue.list_id })).get();
    return todoApi.toTaskList(list);
  },
});
