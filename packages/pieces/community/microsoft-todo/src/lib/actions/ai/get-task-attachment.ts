import { createAction } from '@activepieces/pieces-framework';
import { TaskFileAttachment } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { attachmentOutputSchema } from '../../output-schemas';

export const microsoftTodoGetTaskAttachmentAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_get_task_attachment',
  outputSchema: attachmentOutputSchema,
  displayName: 'Get Task Attachment',
  description: 'Get the details of one file attached to a task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Read the details (name, content type, size, last modified) of one file attached to a Microsoft To Do task, without its content. Get the attachment ID from List Task Attachments; use Download Task Attachment for the file itself. Read-only.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    attachment_id: todoProps.attachmentId(),
  },
  async run(context) {
    const { list_id, task_id, attachment_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const attachment: TaskFileAttachment = await client
      .api(todoApi.attachmentPath({ listId: list_id, taskId: task_id, attachmentId: attachment_id }))
      .get();
    return todoApi.toAttachment(attachment);
  },
});
