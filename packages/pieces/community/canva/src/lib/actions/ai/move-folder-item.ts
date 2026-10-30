import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { moveFolderItemRequest } from '../move-folder-item';

export const canvaMoveFolderItemAi = createAction({
  auth: canvaAuth,
  name: 'canva_move_folder_item',
  displayName: 'Move Folder Item',
  description: 'Moves a design, image or folder into another folder.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.moveFolderItem,
  aiMetadata: {
    description:
      'Moves a design, image asset or folder (by itemId) into the folder toFolderId ("root" for the top level of Projects). Videos are not supported. Fails when the item is in several folders; that item must be moved in the Canva app. Repeating the same move leaves the item where it is.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({ displayName: 'Item ID', description: 'ID of the design, image or folder to move.', required: true }),
    toFolderId: Property.ShortText({ displayName: 'To Folder ID', description: 'Destination folder ID, or root.', required: true }),
  },
  async run(context) {
    const itemId = context.propsValue.itemId.trim();
    const toFolderId = context.propsValue.toFolderId.trim();
    if (!itemId || !toFolderId || itemId.length > 50 || toFolderId.length > 50) {
      throw new Error('Item ID and destination folder ID are required (max 50 characters each).');
    }
    await moveFolderItemRequest({ token: context.auth.access_token, itemId, toFolderId });
    return { moved_item_id: itemId, destination_folder_id: toFolderId, message: `Item ${itemId} moved to folder ${toFolderId}` };
  },
});
