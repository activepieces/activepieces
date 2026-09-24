import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';

export const onedrivePermanentlyDeleteItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_permanently_delete_item',
  displayName: 'Permanently Delete File or Folder',
  description:
    'Permanently delete a OneDrive file or folder, skipping the recycle bin. This cannot be undone.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'PERMANENTLY and irreversibly deletes a file or folder and everything inside it, bypassing the recycle bin, so it can never be restored. Use Delete File or Folder (to Recycle Bin) instead unless the user explicitly asked for permanent deletion. Confirm the exact item first (get its ID from Search Files and Folders or List Folder Contents); retrying after success fails because the item is gone.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the item to delete forever. Or use Path.',
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
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const [item, driveId] = await Promise.all([
      oneDriveApi.request<{ id: string }>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: itemPath,
        queryParams: { $select: 'id' },
      }),
      oneDriveApi.getDriveId({ auth: context.auth }),
    ]);
    await oneDriveApi.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(item.id)}/permanentDelete`,
    });
    return { success: true, itemId: item.id, driveId };
  },
});
