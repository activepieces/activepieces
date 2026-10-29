import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { TaskFileAttachment } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { attachmentOutputSchema } from '../../output-schemas';

export const microsoftTodoUploadTaskAttachmentAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_upload_task_attachment',
  outputSchema: attachmentOutputSchema,
  displayName: 'Upload Task Attachment',
  description: 'Attach a file (up to 25 MB) to a task.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attach a file of up to 25 MB to a Microsoft To Do task, identified by list ID and task ID from List Tasks. Files under 3 MB are sent in one request and larger ones through an upload session. Not idempotent: every call adds another attachment, even for the same file.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach, up to 25 MB.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name shown for the attachment. Defaults to the file\'s own name.',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, task_id, file, file_name } = context.propsValue;
    const size = file.data.length;
    if (size > MAX_BYTES) {
      throw new Error(`The file is ${(size / MB).toFixed(2)} MB; Microsoft To Do accepts attachments up to 25 MB.`);
    }
    const name = file_name?.trim() || file.filename;
    const client = createTodoClient(context.auth);
    const attachmentsPath = `${todoApi.taskPath({ listId: list_id, taskId: task_id })}/attachments`;
    if (size < INLINE_LIMIT_BYTES) {
      const attachment: TaskFileAttachment = await client.api(attachmentsPath).post({
        '@odata.type': '#microsoft.graph.taskFileAttachment',
        name,
        contentBytes: file.data.toString('base64'),
        contentType: 'application/octet-stream',
      });
      return todoApi.toAttachment(attachment);
    }
    const uploaded = await uploadInChunks({ client, attachmentsPath, name, data: file.data });
    return todoApi.toAttachment(uploaded ?? { name, size });
  },
});

async function uploadInChunks({
  client,
  attachmentsPath,
  name,
  data,
}: {
  client: Client;
  attachmentsPath: string;
  name: string;
  data: Buffer;
}): Promise<TaskFileAttachment | undefined> {
  const session = await client.api(`${attachmentsPath}/createUploadSession`).post({
    attachmentInfo: { attachmentType: 'file', name, size: data.length },
  });
  let response: TaskFileAttachment | undefined;
  for (let start = 0; start < data.length; start += CHUNK_BYTES) {
    const end = Math.min(start + CHUNK_BYTES, data.length);
    const chunk = data.subarray(start, end);
    response = await client
      .api(session.uploadUrl)
      .headers({
        'Content-Length': chunk.length.toString(),
        'Content-Range': `bytes ${start}-${end - 1}/${data.length}`,
        'Content-Type': 'application/octet-stream',
      })
      .put(chunk);
  }
  return response;
}

const MB = 1024 * 1024;
const MAX_BYTES = 25 * MB;
const INLINE_LIMIT_BYTES = 3 * MB;
const CHUNK_BYTES = 4 * MB;
