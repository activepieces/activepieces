import { createAction } from '@activepieces/pieces-framework';
import { LinkedResource } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoListLinkedResourcesOutputSchema } from '../../output-schemas';

export const microsoftTodoListLinkedResourcesAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_list_linked_resources',
  outputSchema: microsoftTodoListLinkedResourcesOutputSchema,
  displayName: 'List Linked Resources',
  description: 'List the linked resources (source links) of a task.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the linked resources of one Microsoft To Do task: links back to the item the task came from, such as an email, ticket or web page, with app name, title, URL and external ID. Identify the task by list ID and task ID from List Tasks. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const { list_id, task_id } = context.propsValue;
    const items = await todoApi.listAll<LinkedResource>({
      client: createTodoClient(context.auth),
      path: `${todoApi.taskPath({ listId: list_id, taskId: task_id })}/linkedResources`,
    });
    const linkedResources = items.map(todoApi.toLinkedResource);
    return { linkedResources, count: linkedResources.length };
  },
});
