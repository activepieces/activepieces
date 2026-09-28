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
    project_id: retableCommon.project_id(),
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
