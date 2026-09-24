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
      'Deletes a file or folder by moving it to the OneDrive recycle bin, where the owner can still restore it; deleting a folder also deletes everything inside it. Prefer this over Permanently Delete File or Folder, which cannot be undone. Confirm the exact item first (get its ID from Search Files and Folders or List Folder Contents); retrying after success fails because the item is gone.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file or folder to delete, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The item path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
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
