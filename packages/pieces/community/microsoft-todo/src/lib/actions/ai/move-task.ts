import { createAction, Property } from '@activepieces/pieces-framework';
import { ChecklistItem, LinkedResource, TodoTask } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoMoveTaskOutputSchema } from '../../output-schemas';

export const microsoftTodoMoveTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_move_task',
  outputSchema: microsoftTodoMoveTaskOutputSchema,
  displayName: 'Move Task to Another List',
  description: 'Move a task, with its steps and links, to a different task list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Move a Microsoft To Do task to another list. To Do has no move call, so this copies the task (fields, checklist items, linked resources) into the target list and then deletes the original; the task gets a new ID, returned here. Tasks with attachments are refused so no file is lost. Not idempotent: a retry after success fails because the original is gone.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    target_list_id: Property.ShortText({
      displayName: 'Target Task List ID',
      description: 'ID of the list to move the task to, from List Task Lists.',
      required: true,
    }),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const taskId = context.propsValue.task_id.trim();
    const targetListId = context.propsValue.target_list_id.trim();
    if (listId === targetListId) {
      throw new Error('The task is already in that list.');
    }
    const client = createTodoClient(context.auth);
    const sourcePath = todoApi.taskPath({ listId, taskId });
    const source: TodoTask = await client.api(sourcePath).get();
    if (source.hasAttachments) {
      throw new Error(
        'This task has file attachments, which a move cannot carry over. Download them with Download Task Attachment and re-upload them, or move the task in the To Do app.',
      );
    }
    const checklistItems = await todoApi.listAll<ChecklistItem>({ client, path: `${sourcePath}/checklistItems` });
    const linkedResources = await todoApi.listAll<LinkedResource>({ client, path: `${sourcePath}/linkedResources` });
    const created: TodoTask = await client.api(`${todoApi.listPath({ listId: targetListId })}/tasks`).post({
      title: source.title,
      body: source.body,
      importance: source.importance,
      status: source.status,
      categories: source.categories,
      isReminderOn: source.isReminderOn,
      ...(source.dueDateTime ? { dueDateTime: source.dueDateTime } : {}),
      ...(source.startDateTime ? { startDateTime: source.startDateTime } : {}),
      ...(source.reminderDateTime ? { reminderDateTime: source.reminderDateTime } : {}),
      ...(source.recurrence ? { recurrence: source.recurrence } : {}),
      linkedResources: linkedResources.map((resource) => ({
        displayName: resource.displayName,
        applicationName: resource.applicationName,
        webUrl: resource.webUrl,
        externalId: resource.externalId,
      })),
    });
    const newTaskId = created.id ?? '';
    const newPath = todoApi.taskPath({ listId: targetListId, taskId: newTaskId });
    for (const item of checklistItems) {
      await client.api(`${newPath}/checklistItems`).post({ displayName: item.displayName, isChecked: item.isChecked });
    }
    try {
      await client.api(sourcePath).delete();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `The task was copied to list ${targetListId} as task ${newTaskId}, but the original could not be deleted: ${message}. Delete task ${taskId} from list ${listId} to finish the move.`,
      );
    }
    const moved: TodoTask = await client.api(newPath).get();
    return {
      ...todoApi.toTask(moved),
      listId: targetListId,
      previousListId: listId,
      previousTaskId: taskId,
      checklistItemCount: checklistItems.length,
      linkedResourceCount: linkedResources.length,
    };
  },
});
