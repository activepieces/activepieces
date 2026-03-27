import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common } from '../common';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_upload_file',
  displayName: 'Upload File',
  description:
    'Save generated reports, backups, or exported data from other apps directly into organized cloud folders.',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to upload the file to. Use 0 for root.',
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
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, 'base64');
    const result = await common.pcloudUpload(
      context.auth,
      context.propsValue.folderId,
      context.propsValue.fileName,
      fileBuffer,
    );
    return result;
  },
});
