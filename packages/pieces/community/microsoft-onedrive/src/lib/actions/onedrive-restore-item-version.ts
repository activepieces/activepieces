import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveRestoreItemVersionOutputSchema } from '../output-schemas';

export const onedriveRestoreItemVersion = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_restore_item_version',
  displayName: 'Restore File Version',
  description: 'Make a previous version of a file the current version.',
  audience: 'ai',
  outputSchema: onedriveRestoreItemVersionOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restore an earlier version of one file by copying it into a new current version; the file keeps its ID and the replaced content stays in the version history. Get the version ID from List File Versions and provide the file ID (from Search Files and Folders or List Folder Contents) or a path; use Download File Version to inspect a version without restoring it. Each call adds another version, so retries are not no-ops.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID from Search or List Folder Contents. Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path from the drive root. Used when File ID is empty.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'The ID of the version to restore, from List File Versions.',
      required: true,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    const versionId = context.propsValue.versionId.trim();
    await oneDriveApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `${oneDriveApi.itemPath({ itemId, path })}/versions/${encodeURIComponent(versionId)}/restoreVersion`,
    });
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: itemId?.trim() ? null : path?.trim() || null,
      versionId,
    };
  },
});
