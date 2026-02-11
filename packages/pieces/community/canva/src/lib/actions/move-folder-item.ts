import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move an item (design, image, etc.) to another folder.',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item to move.',
      required: true,
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to move the item to. Use "root" for the top level.',
      required: true,
    }),
  },
  async run(context) {
    const { item_id, to_folder_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const response = await callCanvaApi(
      HttpMethod.POST,
      'folders/move',
      accessToken,
      { item_id, to_folder_id }
    );
    return response.body;
  },
});
