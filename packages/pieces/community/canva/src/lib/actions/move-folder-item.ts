import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const canvaMoveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move a design or asset into a Canva folder.',
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move.',
      required: true,
    }),
    to_folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to move the item into.',
      required: true,
    }),
  },
  async run(context) {
    const { item_id, to_folder_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    const result = await canvaApiCall({
      accessToken,
      method: HttpMethod.POST,
      resourceUrl: '/folders/move',
      body: {
        item_id,
        to_folder_id,
      },
    });

    return result;
  },
});
