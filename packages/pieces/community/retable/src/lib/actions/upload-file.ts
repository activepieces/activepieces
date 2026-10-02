import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableUploadFileAction = createAction({
  auth: retableAuth,
  name: 'retable_upload_file',
  classification: 'WRITE',
  displayName: 'Upload File to Project',
  description: 'Uploads a file (under 20MB) to a project',
  audience: 'ai',
  aiMetadata: { description: 'Uploads a file to a Retable project. The file must be under 20MB. Not idempotent — each call uploads a new file.', idempotent: false },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'ID of the project, from Get Projects or Get Specific Workspace',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, file, title } = context.propsValue;

    const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
    const fileSizeBytes = Buffer.byteLength(file.base64, 'base64');
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File is ${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB, which exceeds Retable's 20MB upload limit`);
    }

    const formData = new FormData();
    formData.append('file', Buffer.from(file.base64, 'base64'), file.filename);

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/data/file/upload/${project_id}`,
        headers: {
          ApiKey: context.auth.secret_text,
          ...formData.getHeaders(),
        },
        queryParams: title ? { title } : {},
        body: formData,
      })
    ).body;
  },
});
