import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDeleteChecklistItemOutputSchema } from '../../output-schemas';

export const microsoftTodoDeleteChecklistItemAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_delete_checklist_item',
  outputSchema: microsoftTodoDeleteChecklistItemOutputSchema,
  displayName: 'Delete Checklist Item',
  description: 'Permanently delete a checklist item from a task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently remove one checklist item (step) from a Microsoft To Do task; this cannot be undone. Get the ID from List Checklist Items; to just tick it off, use Update Checklist Item instead. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    checklist_item_id: todoProps.checklistItemId(),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const taskId = context.propsValue.task_id.trim();
    const checklistItemId = context.propsValue.checklist_item_id.trim();
    const client = createTodoClient(context.auth);
    await client.api(todoApi.checklistItemPath({ listId, taskId, checklistItemId })).delete();
    return { success: true, listId, taskId, checklistItemId };
  },
});
