import { createAction, Property } from '@activepieces/pieces-framework';
import { ChecklistItem } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { checklistItemOutputSchema } from '../../output-schemas';

export const microsoftTodoUpdateChecklistItemAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_update_checklist_item',
  outputSchema: checklistItemOutputSchema,
  displayName: 'Update Checklist Item',
  description: 'Change the text or checked state of a checklist item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Change the text and/or checked state of one checklist item (step) of a Microsoft To Do task; use it to check off or uncheck a step. Get the checklist item ID from List Checklist Items. Fields left empty keep their values.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    checklist_item_id: todoProps.checklistItemId(),
    display_name: Property.ShortText({
      displayName: 'Text',
      description: 'New text for the checklist item.',
      required: false,
    }),
    is_checked: Property.StaticDropdown({
      displayName: 'Checked',
      description: 'Check or uncheck the item. Leave empty to keep it as is.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const { list_id, task_id, checklist_item_id, display_name, is_checked } = context.propsValue;
    const patch: ChecklistItem = {
      ...(display_name !== undefined ? { displayName: display_name } : {}),
      ...(is_checked ? { isChecked: is_checked === 'yes' } : {}),
    };
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide new text, a checked state, or both.');
    }
    const client = createTodoClient(context.auth);
    const item: ChecklistItem = await client
      .api(todoApi.checklistItemPath({ listId: list_id, taskId: task_id, checklistItemId: checklist_item_id }))
      .update(patch);
    return todoApi.toChecklistItem(item);
  },
});
