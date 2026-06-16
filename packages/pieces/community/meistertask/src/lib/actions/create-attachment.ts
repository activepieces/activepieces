import { meistertaskAuth } from '../auth';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { Project } from '@activepieces/shared';

export const createAttachment = createAction({
  auth: meistertaskAuth,
  name: 'create_attachment',
  displayName: 'Create Attachment',
  description: 'Creates a new attachment',
  audience: 'both',
  aiMetadata: { description: 'Upload a file as an attachment on a specific MeisterTask task, with an optional display name. Use to attach a document or image to a task; requires the task ID and the file. Not idempotent — each call adds another attachment.', idempotent: false },
  props: {
    task_id: meisterTaskCommon.task_id,
    file_url: Property.File({
      displayName: 'File URL',
      description: 'URL of the file to attach',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, file_url, name } = context.propsValue;

    const body: any = { url: file_url };
    if (name) body.name = name;

    const response = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/attachments`,
      token,
      body
    );

    return response.body;
  },
});