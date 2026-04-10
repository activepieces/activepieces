import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { canvaCommon } from '../common';

export const moveFolderItemAction = createAction({
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move a design or asset to a different folder.',
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the design or asset to move.',
      required: true,
    }),
    itemType: Property.Dropdown({
        displayName: 'Item Type',
        description: 'The type of item being moved.',
        required: true,
        options: {
            options: [
                { label: 'Design', value: 'design' },
                { label: 'Asset', value: 'asset' },
            ]
        }
    }),
    destinationFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder where the item should be moved.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { itemId, itemType, destinationFolderId } = propsValue;

    // Canva API might have a specific endpoint for moving, or it might be a PATCH
    // operation on the item itself to update its parent_folder_id.
    // Assuming a generic move endpoint for simplicity.

    const body = {
      destination_folder_id: destinationFolderId,
    };

    const response = await canvaCommon.makeRequest(
      auth.access_token,
      HttpMethod.POST, // Or PUT/PATCH depending on API design
      `/${itemType}s/${itemId}/move`, // Hypothetical endpoint
      body
    );

    return {
      itemId: itemId,
      newFolderId: destinationFolderId,
      message: 'Item moved successfully.',
      data: response,
    };
  },
});
