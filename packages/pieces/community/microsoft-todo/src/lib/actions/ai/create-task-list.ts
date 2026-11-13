import { createAction, Property } from '@activepieces/pieces-framework';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { taskListOutputSchema } from '../../output-schemas';

export const microsoftTodoCreateTaskListAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_create_task_list',
  outputSchema: taskListOutputSchema,
  displayName: 'Create Task List',
  description: 'Create a new task list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Create a new Microsoft To Do task list and return its ID. To Do allows several lists with the same name, so check List Task Lists first if a duplicate would be a problem. Not idempotent: every call creates another list.',
    idempotent: false,
  },
  props: {
    display_name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new task list.',
      required: true,
    }),
  },
  async run(context) {
    const client = createTodoClient(context.auth);
    const list: TodoTaskList = await client
      .api('/me/todo/lists')
      .post({ displayName: context.propsValue.display_name });
    return todoApi.toTaskList(list);
  },
});
