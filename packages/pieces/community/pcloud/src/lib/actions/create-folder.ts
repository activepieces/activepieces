import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud',
  props: {
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the new folder',
      required: true,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'ID of the parent folder (0 for root)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { folderName, parentFolderId } = context.propsValue;

    const result = await client.createFolder(
      folderName,
      parentFolderId ?? 0
    );

    if (result.result !== 0) {
      throw new Error(result.error || 'Failed to create folder');
    }

    return result.metadata;
  },
});
