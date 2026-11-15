import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveItemActionOutputSchema } from '../output-schemas';

export const onedriveDeleteItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_delete_item',
  displayName: 'Delete File or Folder (to Recycle Bin)',
  description: 'Move a OneDrive file or folder to the recycle bin. Deleting a folder also deletes everything in it.',
  audience: 'ai',
  outputSchema: onedriveItemActionOutputSchema,
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a file or folder by moving it to the OneDrive recycle bin, where the owner can still restore it; deleting a folder also deletes everything inside it. Confirm the exact item first (get its ID from Search Files and Folders or List Folder Contents); retrying after success fails because the item is gone.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the item to delete, from Search or List Folder Contents.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path from the drive root. Use this or Item ID.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    await oneDriveApi.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: oneDriveApi.itemPath({ itemId, path }),
    });
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: itemId?.trim() ? null : path?.trim() || null,
    };
  },
});
