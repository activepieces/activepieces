import { createAction } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { TaskFileAttachment } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { microsoftTodoDownloadTaskAttachmentOutputSchema } from '../../output-schemas';

export const microsoftTodoDownloadTaskAttachmentAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_download_task_attachment',
  outputSchema: microsoftTodoDownloadTaskAttachmentOutputSchema,
  displayName: 'Download Task Attachment',
  description: 'Download a file attached to a task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Download the content of one file attached to a Microsoft To Do task and return it as a file reference other steps can use. Get the attachment ID from List Task Attachments. Read-only.',
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
    const path = todoApi.attachmentPath({ listId: list_id, taskId: task_id, attachmentId: attachment_id });
    const attachment: TaskFileAttachment = await client.api(path).get();
    const content: ArrayBuffer = await client.api(`${path}/$value`).responseType(ResponseType.ARRAYBUFFER).get();
    const fileName = attachment.name ?? 'attachment';
    return {
      ...todoApi.toAttachment(attachment),
      file: await context.files.write({ fileName, data: Buffer.from(content) }),
    };
  },
});
