import { createAction } from '@activepieces/pieces-framework';
import { TaskFileAttachment } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoListTaskAttachmentsOutputSchema } from '../../output-schemas';

export const microsoftTodoListTaskAttachmentsAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_list_task_attachments',
  outputSchema: microsoftTodoListTaskAttachmentsOutputSchema,
  displayName: 'List Task Attachments',
  description: 'List the files attached to a task.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the files attached to one Microsoft To Do task with their IDs, names, types and sizes, without their content. Identify the task by list ID and task ID from List Tasks; use Download Task Attachment for a file\'s content. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
  },
  async run(context) {
    const { list_id, task_id } = context.propsValue;
    const items = await todoApi.listAll<TaskFileAttachment>({
      client: createTodoClient(context.auth),
      path: `${todoApi.taskPath({ listId: list_id, taskId: task_id })}/attachments`,
    });
    const attachments = items.map(todoApi.toAttachment);
    return { attachments, count: attachments.length };
  },
});
