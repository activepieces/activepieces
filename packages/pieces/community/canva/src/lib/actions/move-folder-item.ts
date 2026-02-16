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
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item (design or asset) to move',
      required: true,
    }),
    toFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder. Use "root" for the top-level projects.',
      required: true,
    }),
  },
  async run(context) {
    const { itemId, toFolderId } = context.propsValue;

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
      item_id: itemId,
      to_folder_id: toFolderId,
      response,
    };
  },
});
