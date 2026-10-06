import { createAction } from '@activepieces/pieces-framework';
import { ChecklistItem } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { checklistItemOutputSchema } from '../../output-schemas';

export const microsoftTodoGetChecklistItemAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_checklist_item',
  outputSchema: checklistItemOutputSchema,
  displayName: 'Get Checklist Item',
  description: 'Get one checklist item of a task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read one checklist item (step) of a Microsoft To Do task: its text, checked state and dates. Get the checklist item ID from List Checklist Items. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    checklist_item_id: todoProps.checklistItemId(),
  },
  async run(context) {
    const { list_id, task_id, checklist_item_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const item: ChecklistItem = await client
      .api(todoApi.checklistItemPath({ listId: list_id, taskId: task_id, checklistItemId: checklist_item_id }))
      .get();
    return todoApi.toChecklistItem(item);
  },
});
