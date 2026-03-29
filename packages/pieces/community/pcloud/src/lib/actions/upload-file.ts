import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../..';
import { pcloudCommon } from '../common';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description:
    'Save generated reports, backups, or exported data from other apps directly into organized cloud folders.',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the destination folder. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name for the uploaded file (e.g. report.pdf)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
  },
  async run(context) {
    const fileBuffer = Buffer.from(context.propsValue.file.base64, 'base64');
    const result = await pcloudCommon.uploadFileToPcloud(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.fileName,
      fileBuffer,
    );
    return result;
  },
});
