import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { taskListOutputSchema } from '../../output-schemas';

export const microsoftTodoUpdateTaskListAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_update_task_list',
  outputSchema: taskListOutputSchema,
  displayName: 'Rename Task List',
  description: 'Rename a task list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Rename a Microsoft To Do task list, identified by its ID from List Task Lists. The built-in "Tasks" and "Flagged email" lists cannot be renamed. Setting the same name again changes nothing.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    display_name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name for the task list.',
      required: true,
    }),
  },
  async run(context) {
    const { list_id, display_name } = context.propsValue;
    const client = createTodoClient(context.auth);
    const list: TodoTaskList = await client
      .api(todoApi.listPath({ listId: list_id }))
      .update({ displayName: display_name });
    return todoApi.toTaskList(list);
  },
});
