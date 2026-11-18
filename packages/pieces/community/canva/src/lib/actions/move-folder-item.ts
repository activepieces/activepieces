import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, canvaCommon, canvaProps } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const moveFolderItem = createAction({
  auth: canvaAuth,
  name: 'move_folder_item',
  classification: 'WRITE',
  displayName: 'Move Folder Item',
  description: 'Move a design or image into another folder.',
  audience: 'human',
  aiMetadata: {
    description: 'Moves a Canva design or image into a folder. Human step; agents use canva_move_folder_item. Repeating the same move leaves the item in the same folder.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.moveFolderItem,
  props: {
    to_folder_id: canvaProps.folderDropdown({ displayName: 'Destination Folder', description: 'The folder to move the item to.' }),
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The kind of item to move.',
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
      auth: canvaAuth,
      displayName: 'Item to Move',
      description: 'The design or image to move.',
      required: true,
      refreshers: ['item_type'],
      options: async ({ auth, item_type }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your Canva account first', options: [] };
        }
        if (!item_type) {
          return { disabled: true, placeholder: 'Select an item type first', options: [] };
        }
        try {
          const result = item_type === 'image' ? await canvaCommon.fetchUserAssets({ auth }) : await canvaCommon.fetchUserDesigns({ auth });
          return canvaCommon.dropdownState({ result });
        } catch (error) {
          return canvaCommon.dropdownError({ error, what: 'items' });
        }
      },
    }),
  },
  async run(context) {
    const toFolderId = context.propsValue.to_folder_id.trim();
    const itemId = String(context.propsValue.item_id ?? '').trim();
    if (!toFolderId || !itemId) {
      throw new Error('Destination folder and item are required.');
    }
    await moveItem({ token: context.auth.access_token, toFolderId, itemId });
    return {
      success: true,
      message: `Item ${itemId} moved to folder ${toFolderId}`,
      moved_item_id: itemId,
      destination_folder_id: toFolderId,
    };
  },
});

async function moveItem({ token, toFolderId, itemId }: { token: string; toFolderId: string; itemId: string }): Promise<void> {
  await canvaClient.request<unknown>({
    token,
    method: HttpMethod.POST,
    path: '/folders/move',
    body: { to_folder_id: toFolderId, item_id: itemId },
  });
}

export const moveFolderItemRequest = moveItem;
