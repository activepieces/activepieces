import {
  PieceAuth,
  createPiece,
  PieceCategory,
  PieceProperty,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, folderId, API_BASE_URL } from '../auth';
import { PCloudClient } from '../lib/common/client';

/**
 * List Folder Action
 * Lists all files and folders in a pCloud folder
 */
export const listFolder = createAction({
  auth: pcloudAuth,
  displayName: 'List Folder',
  description: 'List all files and folders in a pCloud folder',
  props: {
    folder_id: folderId,
    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description: 'Include deleted items in the result',
      required: false,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const result = await client.listFolder(context.propsValue.folder_id);

    if (context.propsValue.include_deleted) {
      return result;
    }

    // Filter out deleted items
    if (result.metadata) {
      result.metadata = result.metadata.filter((item: any) => !item.isdeleted);
    }

    return result;
  },
});
