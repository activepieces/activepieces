import { createAction, Property } from '@activepieces/pieces-framework';
import { ChecklistItem } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { checklistItemOutputSchema } from '../../output-schemas';

export const microsoftTodoCreateChecklistItemAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_create_checklist_item',
  outputSchema: checklistItemOutputSchema,
  displayName: 'Add Checklist Item',
  description: 'Add a checklist item (step) to a task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Add a checklist item (a "step" or subtask) to a Microsoft To Do task, identified by list ID and task ID from List Tasks, optionally already checked. Not idempotent: every call adds another item, even with the same text.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    display_name: Property.ShortText({
      displayName: 'Text',
      description: 'Text of the checklist item.',
      required: true,
    }),
    is_checked: Property.Checkbox({
      displayName: 'Checked',
      description: 'Create the item already checked off.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { list_id, task_id, display_name, is_checked } = context.propsValue;
    const client = createTodoClient(context.auth);
    const item: ChecklistItem = await client
      .api(`${todoApi.taskPath({ listId: list_id, taskId: task_id })}/checklistItems`)
      .post({ displayName: display_name, isChecked: is_checked ?? false });
    return todoApi.toChecklistItem(item);
  },
});
