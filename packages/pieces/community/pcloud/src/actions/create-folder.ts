import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../index';
import { makeApiCall } from '../lib/common';

export const createFolder = createAction({
  auth: pcloudAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud',
  props: {
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the folder to create',
      required: true,
    }),
    parentPath: Property.ShortText({
      displayName: 'Parent Folder Path',
      description: 'Path where to create the folder (e.g., /Documents). Leave empty for root.',
      required: false,
      defaultValue: '/',
    }),
  },
  async run(context) {
    const { folderName, parentPath } = context.propsValue;

    const result = await makeApiCall(context.auth, 'createfolder', {
      path: `${parentPath || '/'}/${folderName}`,
    });

    return {
      success: true,
      folder: result.metadata,
      message: `Folder "${folderName}" created successfully`,
    };
  },
});
