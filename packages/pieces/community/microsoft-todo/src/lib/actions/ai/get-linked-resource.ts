import { createAction } from '@activepieces/pieces-framework';
import { LinkedResource } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { linkedResourceOutputSchema } from '../../output-schemas';

export const microsoftTodoGetLinkedResourceAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_linked_resource',
  outputSchema: linkedResourceOutputSchema,
  displayName: 'Get Linked Resource',
  description: 'Get one linked resource of a task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read one linked resource of a Microsoft To Do task (app name, title, URL, external ID). Get the linked resource ID from List Linked Resources. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    linked_resource_id: todoProps.linkedResourceId(),
  },
  async run(context) {
    const { list_id, task_id, linked_resource_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const resource: LinkedResource = await client
      .api(todoApi.linkedResourcePath({ listId: list_id, taskId: task_id, linkedResourceId: linked_resource_id }))
      .get();
    return todoApi.toLinkedResource(resource);
  },
});
