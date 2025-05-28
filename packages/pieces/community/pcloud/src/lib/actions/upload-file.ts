import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const uploadFileAction = createAction({
  auth: pcloudAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to pCloud',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID where the file will be uploaded (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to be uploaded',
      required: true,
    }),
    fileContent: Property.File({
      displayName: 'File Content',
      description: 'Content of the file to upload',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Overwrite if file exists',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.POST,
      '/uploadfile',
      null,
      {
        folderid: propsValue.folderId.toString(),
        filename: propsValue.fileName,
        data: propsValue.fileContent.base64,
        nopartial: '1',
        renameifexists: propsValue.overwrite ? '0' : '1',
      }
    );

    return response;
  },
});
