import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveDeletePermissionOutputSchema } from '../output-schemas';

export const onedriveDeleteItemPermission = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_delete_item_permission',
  displayName: 'Remove Permission (Stop Sharing)',
  description: 'Remove a person\'s access or revoke a sharing link on a OneDrive file or folder.',
  audience: 'ai',
  outputSchema: onedriveDeletePermissionOutputSchema,
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one permission from a file or folder, which revokes that person\'s access or disables that sharing link for everyone who has it; it cannot be undone except by sharing again. Get the permission ID from List File Permissions; only non-inherited permissions can be removed, and a retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file or folder, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The item path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
      required: false,
    }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description:
        'The ID of the permission or sharing link to remove, from List File Permissions. This immediately cuts off that access.',
      required: true,
    }),
  },
  async run(context) {
    const { itemId, path, permissionId } = context.propsValue;
    const trimmedPermissionId = permissionId.trim();
    try {
      await oneDriveApi.request({
        auth: context.auth,
        method: HttpMethod.DELETE,
        path: `${oneDriveApi.itemPath({ itemId, path })}/permissions/${encodeURIComponent(trimmedPermissionId)}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${message} Only permissions set directly on this item can be removed; inherited ones must be removed on the parent folder they come from.`,
      );
    }
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: path?.trim() || null,
      permissionId: trimmedPermissionId,
    };
  },
});
