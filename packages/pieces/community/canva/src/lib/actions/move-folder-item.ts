import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const moveFolderItemAction = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Item to Folder',
  description: 'Move a design or asset to a specific folder',
  props: {
    toFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder (use "root" for top level)',
      required: true,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move',
      required: true,
    }),
  },
  async run(context) {
    const { toFolderId, itemId } = context.propsValue;

    // Endpoint is POST /folders/move (not /folders/{id}/items)
    const response = await canvaApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/folders/move',
      body: {
        to_folder_id: toFolderId,
        item_id: itemId,
      },
    });

    return {
      success: true,
      to_folder_id: toFolderId,
      item_id: itemId,
      response,
    };
  },
});
