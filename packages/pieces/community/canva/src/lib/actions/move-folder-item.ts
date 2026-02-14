import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move an item (design, image, folder) to another folder in Canva.',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item to move.',
      required: true,
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder. Use "root" for the top-level Projects folder.',
      required: true,
    }),
  },
  async run(context) {
    return await canvaCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/folders/move',
      {
        item_id: context.propsValue.item_id,
        to_folder_id: context.propsValue.to_folder_id,
      },
    );
  },
});
