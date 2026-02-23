import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudListFolder = createAction({
  auth: pcloudAuth,
  name: 'list_folder',
  displayName: 'List Folder Contents',
  description: 'List files and folders in a pCloud folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the folder to list (0 for root)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { folderId } = context.propsValue;

    const result = await client.listFolder(folderId ?? 0);

    if (result.result !== 0) {
      throw new Error(result.error || 'Failed to list folder');
    }

    return result.metadata;
  },
});
