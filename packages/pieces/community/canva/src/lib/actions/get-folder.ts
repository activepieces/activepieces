import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve details about a specific folder',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder to retrieve',
      required: true,
    }),
    includeItems: Property.Checkbox({
      displayName: 'Include Items',
      description: 'Include list of items in the folder',
      required: false,
      defaultValue: true,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type Filter',
      description: 'Filter items by type',
      required: false,
      options: {
        options: [
          { label: 'All Items', value: 'all' },
          { label: 'Designs Only', value: 'designs' },
          { label: 'Assets Only', value: 'assets' },
        ],
      },
      defaultValue: 'all',
    }),
    limit: Property.Number({
      displayName: 'Items Limit',
      description: 'Maximum number of items to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { folderId, includeItems, itemType, limit } = context.propsValue;
    
    try {
      const folder = await canvaCommon.makeRequest(
        context.auth,
        'GET',
        `/folders/${folderId}`
      );

      let items = [(folder.folder as any)];
      if (includeItems) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        
        if (itemType === 'all' || itemType === 'designs') {
          const designs = await canvaCommon.makeRequest(
            context.auth,
            'GET',
            `/folders/${folderId}/designs?${params.toString()}`
          );
          items = items.concat(designs.designs.map((d:any) => ({ ...d, type: 'design' })));
        }
        
        if (itemType === 'all' || itemType === 'assets') {
          const assets = await canvaCommon.makeRequest(
            context.auth,
            'GET',
            `/folders/${folderId}/assets?${params.toString()}`
          );
          items = items.concat(assets.assets.map((a:any) => ({ ...a, type: 'asset' })));
        }
      }

      return {
        success: true,
        folder: folder.folder,
        items: items,
        itemCount: items.length,
        message: `Retrieved folder "${folder.folder.name}" with ${items.length} items`,
      };
    } catch (e:any) {
      throw new Error(`Failed to get folder: ${e.message}`);
    }
  },
});
