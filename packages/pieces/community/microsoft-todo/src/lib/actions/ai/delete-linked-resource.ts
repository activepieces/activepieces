import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDeleteLinkedResourceOutputSchema } from '../../output-schemas';

export const microsoftTodoDeleteLinkedResourceAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_delete_linked_resource',
  outputSchema: microsoftTodoDeleteLinkedResourceOutputSchema,
  displayName: 'Delete Linked Resource',
  description: 'Remove a linked resource from a task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently remove one linked resource from a Microsoft To Do task; the source item itself is not touched. Get the ID from List Linked Resources. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    linked_resource_id: todoProps.linkedResourceId(),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const taskId = context.propsValue.task_id.trim();
    const linkedResourceId = context.propsValue.linked_resource_id.trim();
    const client = createTodoClient(context.auth);
    await client.api(todoApi.linkedResourcePath({ listId, taskId, linkedResourceId })).delete();
    return { success: true, listId, taskId, linkedResourceId };
  },
});
