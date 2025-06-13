import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const createFolderAction = createAction({
  auth: pcloudAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud',
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID where the new folder will be created (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the folder to be created',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      (auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/createfolder',
      null,
      {
        folderid: propsValue.parentFolderId.toString(),
        name: propsValue.folderName,
      }
    );

    return response;
  },
});
