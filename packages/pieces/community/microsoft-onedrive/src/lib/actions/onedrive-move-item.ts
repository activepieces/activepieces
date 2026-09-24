import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveMoveItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_move_item',
  displayName: 'Move File or Folder',
  description: 'Move a OneDrive file or folder to another folder, optionally renaming it.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a file or folder (with its contents) into another folder in the same drive, optionally renaming it; the item keeps its ID. Use Rename / Update File or Folder to rename without moving, and Copy File or Folder to keep the original. Fails if the destination already has an item with the same name unless you set New Name; moving between drives is not supported. Safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the item to move, from Search or List Folder Contents.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path from the drive root. Use this or Item ID.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
    destinationFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'Folder to move into. Leave empty for the drive root.',
      required: false,
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional new name for the item. Leave empty to keep its current name.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, destinationFolderId, newName } = context.propsValue;
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const parentId = await oneDriveApi.resolveFolderId({ auth: context.auth, folderId: destinationFolderId });
    const body: Record<string, unknown> = { parentReference: { id: parentId } };
    const trimmedName = newName?.trim();
    if (trimmedName) {
      body['name'] = trimmedName;
    }
    try {
      const item = await oneDriveApi.request<GraphDriveItem>({
        auth: context.auth,
        method: HttpMethod.PATCH,
        path: itemPath,
        body,
      });
      return oneDriveApi.toItem(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith('An item with that name already exists')) {
        throw new Error(`${message} Set New Name to move it under a different name.`);
      }
      throw error;
    }
  },
});
