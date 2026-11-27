import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const uploadFileAction = createAction({
  auth: boxAuth,
  name: 'box_upload_file',
  displayName: 'Upload File',
  description: 'Uploads a new file to a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a new file (up to 50 MB) into a Box folder and returns it with its new ID. Fails with 409 if the folder already has a file with that name: use Upload File Version to replace an existing file.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({
      required: true,
      displayName: 'Parent Folder ID',
      description: 'ID of the folder to upload into. "0" is the root "All Files" folder.',
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload: a URL or base64 content.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the file in Box, with extension. Defaults to the uploaded file\'s own name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fileName = propsValue.fileName ?? propsValue.file.filename;
    return await boxClient.upload({
      auth,
      path: '/files/content',
      attributes: { name: fileName, parent: { id: propsValue.folderId } },
      file: propsValue.file.data,
      fileName,
    });
  },
});
