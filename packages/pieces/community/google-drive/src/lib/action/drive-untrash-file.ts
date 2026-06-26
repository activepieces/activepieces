import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { drive as googleDrive } from '@googleapis/drive';

export const driveUntrashFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_untrash_file',
  displayName: 'Restore File from Trash',
  description: 'Restore a trashed Drive file by ID back to its original location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Restores a trashed file by ID back to its original location. Use to undo a `drive_trash_file`; to permanently purge instead use `drive_empty_trash` or `drive_delete_file`. Safe to retry — re-restoring an active file is a no-op.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the trashed file to restore. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const { file_id, include_team_drives } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response = await drive.files.update({
        fileId: file_id,
        supportsAllDrives: include_team_drives,
        requestBody: { trashed: false },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied restoring file ${file_id}. You may lack permission to restore this resource.`
        );
      }
      throw error;
    }
  },
});
