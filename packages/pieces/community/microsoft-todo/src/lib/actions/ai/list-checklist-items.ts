import { createAction } from '@activepieces/pieces-framework';
import { ChecklistItem } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoListChecklistItemsOutputSchema } from '../../output-schemas';

export const microsoftTodoListChecklistItemsAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_list_checklist_items',
  outputSchema: microsoftTodoListChecklistItemsOutputSchema,
  displayName: 'List Checklist Items',
  description: 'List the checklist items (steps) of a task.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List every checklist item (the "steps" or subtasks) of one Microsoft To Do task, with their IDs and checked state. Identify the task by list ID and task ID from List Tasks. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const { list_id, task_id } = context.propsValue;
    const items = await todoApi.listAll<ChecklistItem>({
      client: createTodoClient(context.auth),
      path: `${todoApi.taskPath({ listId: list_id, taskId: task_id })}/checklistItems`,
    });
    const checklistItems = items.map(todoApi.toChecklistItem);
    return { checklistItems, count: checklistItems.length };
  },
});
