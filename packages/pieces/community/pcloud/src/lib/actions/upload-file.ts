import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to pCloud',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the uploaded file',
      required: true,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the folder to upload to (0 for root)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { file, fileName, folderId } = context.propsValue;

    const result = await client.uploadFile(
      fileName,
      file.base64,
      folderId ?? 0
    );

    if (result.result !== 0) {
      throw new Error(result.error || 'Failed to upload file');
    }

    return result.metadata;
  },
});
