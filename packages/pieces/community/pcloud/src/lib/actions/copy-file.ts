import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const copyFileAction = createAction({
  auth: pcloudAuth,
  name: 'copy_file',
  displayName: 'Copy File',
  description: 'Copy a file to another folder in pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to copy',
      required: true,
    }),
    toFolderId: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder where the file will be copied to',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Overwrite if the file exists in the destination folder',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/copyfile',
      null,
      {
        fileid: propsValue.fileId.toString(),
        tofolderid: propsValue.toFolderId.toString(),
        noover: propsValue.overwrite ? '0' : '1',
      }
    );

    return response;
  },
});
