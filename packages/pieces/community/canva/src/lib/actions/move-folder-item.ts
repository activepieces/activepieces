import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const moveFolderItemAction = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Moves a design or asset into a specific Canva folder.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to move the item into.',
      required: true,
    }),
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move.',
      required: true,
    }),
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The type of item to move.',
      required: true,
      defaultValue: 'DESIGN',
      options: {
        options: [
          { label: 'Design', value: 'DESIGN' },
          { label: 'Image', value: 'IMAGE' },
        ],
      },
    }),
  },
  async run(context) {
    const { folder_id, item_id, item_type } = context.propsValue;
    const accessToken = context.auth.access_token;

    return canvaApiCall({
      accessToken,
      method: HttpMethod.POST,
      path: `/folders/${encodeURIComponent(folder_id)}/items/move`,
      body: {
        items: [{ type: item_type, id: item_id }],
      },
    });
  },
});
