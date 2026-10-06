import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDeleteTaskAttachmentOutputSchema } from '../../output-schemas';

export const microsoftTodoDeleteTaskAttachmentAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_delete_task_attachment',
  outputSchema: microsoftTodoDeleteTaskAttachmentOutputSchema,
  displayName: 'Delete Task Attachment',
  description: 'Permanently remove a file attached to a task.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently delete one file attached to a Microsoft To Do task; this cannot be undone. Get the attachment ID from List Task Attachments. A retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    attachment_id: todoProps.attachmentId(),
  },
  async run(context) {
    const listId = context.propsValue.list_id.trim();
    const taskId = context.propsValue.task_id.trim();
    const attachmentId = context.propsValue.attachment_id.trim();
    const client = createTodoClient(context.auth);
    await client.api(todoApi.attachmentPath({ listId, taskId, attachmentId })).delete();
    return { success: true, listId, taskId, attachmentId };
  },
});
