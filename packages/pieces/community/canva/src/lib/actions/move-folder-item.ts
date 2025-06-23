import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon, fetchUserFolders, fetchUserDesigns, fetchUserAssets } from '../common';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Move an item from one folder to another in Canva',
  props: {
    to_folder_id: Property.Dropdown({
      displayName: 'Destination Folder',
      description: 'Select the folder to move the item to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        try {
          const folders = await fetchUserFolders(auth);
          return {
            disabled: false,
            options: folders,
          };
        } catch (error) {
          console.error('Error fetching folders:', error);
          return {
            disabled: true,
            placeholder: 'Error loading folders',
            options: [],
          };
        }
      },
    }),
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'Select the type of item you want to move',
      required: true,
      defaultValue: 'design',
      options: {
        options: [
          { label: 'Design', value: 'design' },
          { label: 'Image Asset', value: 'image' },
        ],
      },
    }),
    item_id: Property.Dropdown({
      displayName: 'Item to Move',
      description: 'Select the item you want to move',
      required: true,
      refreshers: ['item_type'],
      options: async ({ auth, item_type }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        if (!item_type) {
          return {
            disabled: true,
            placeholder: 'Please select an item type first',
            options: [],
          };
        }
        
        try {
          let items: Array<{ label: string; value: string }> = [];
          
          if (item_type === 'design') {
            items = await fetchUserDesigns(auth);
          } else if (item_type === 'image') {
            items = await fetchUserAssets(auth, 'image');
          }
          
          return {
            disabled: false,
            options: items,
          };
        } catch (error) {
          console.error('Error fetching items:', error);
          return {
            disabled: true,
            placeholder: 'Error loading items',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { to_folder_id, item_id } = context.propsValue;
    const authValue = context.auth as OAuth2PropertyValue;

    try {
      const response = await fetch(`${canvaCommon.baseUrl}/folders/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authValue.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_folder_id,
          item_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          if (errorData.type === 'item_in_multiple_folders') {
            throw new Error(
              'This item exists in multiple folders. Please use the Canva UI to move the item to another folder.'
            );
          }
          throw new Error(`Bad Request: ${errorData.message || 'Invalid request parameters'}`);
        }
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Please check your authentication credentials');
        }
        
        if (response.status === 403) {
          throw new Error('Forbidden: Insufficient permissions or invalid folder/item access');
        }
        
        if (response.status === 404) {
          throw new Error('Not Found: The specified folder or item does not exist');
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests (limit: 100 per minute)');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
      }

      return {
        success: true,
        message: `Item ${item_id} successfully moved to folder ${to_folder_id}`,
        moved_item_id: item_id,
        destination_folder_id: to_folder_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to move folder item: ${String(error)}`);
    }
  },
}); 