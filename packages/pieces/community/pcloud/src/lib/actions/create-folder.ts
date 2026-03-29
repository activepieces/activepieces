import {
  createAction,
  PieceAuth,
  PieceProperty,
  Property,
} from '@activepieces/pieces-framework';
import { pcloudAuth, folderId } from '../auth';
import { PCloudClient } from '../lib/common/client';

/**
 * Create Folder Action
 * Creates a new folder in pCloud
 */
export const createFolder = createAction({
  auth: pcloudAuth,
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud',
  props: {
    parent_folder_id: folderId,
    folder_name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the folder to create',
      required: true,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const result = await client.createFolder(
      context.propsValue.parent_folder_id,
      context.propsValue.folder_name
    );

    return result;
  },
});
