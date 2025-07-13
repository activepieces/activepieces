import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move a design or asset to a different folder',
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the design or asset to move',
      required: true,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Type of item to move',
      required: true,
      options: {
        options: [
          { label: 'Design', value: 'design' },
          { label: 'Asset', value: 'asset' },
        ],
      },
    }),
    targetFolderId: Property.ShortText({
      displayName: 'Target Folder ID',
      description: 'ID of the folder to move the item to',
      required: true,
    }),
    createFolder: Property.Checkbox({
      displayName: 'Create Folder if Not Exists',
      description: 'Create the target folder if it does not exist',
      required: false,
      defaultValue: false,
    }),
    folderName: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name for the folder if creating a new one',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, itemType, targetFolderId, createFolder, folderName } = context.propsValue;
    
    try {
      if (createFolder) {
        try {
          await canvaCommon.makeRequest(
            context.auth,
            'GET',
            `/folders/${targetFolderId}`
          );
        } catch (error:any) {
          if (error.message.includes('404')) {
            // if folder does not exist, create it
            await canvaCommon.makeRequest(
              context.auth,
              'POST',
              '/folders',
              {
                name: folderName || 'New Folder',
                id: targetFolderId,
              }
            );
          }
        }
      }

      const endpoint = itemType === 'design' ? `/designs/${itemId}` : `/assets/${itemId}`;
      const result = await canvaCommon.makeRequest(
        context.auth,
        'PATCH',
        endpoint,
        {
          folder_id: targetFolderId,
        }
      );

      return {
        success: true,
        item: result[itemType],
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} moved to folder successfully`,
      };
    } catch (error:any) {
      throw new Error(`Failed to move ${itemType}: ${error.message}`);
    }
  },
});