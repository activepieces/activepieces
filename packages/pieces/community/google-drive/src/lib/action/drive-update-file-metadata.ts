import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { drive as googleDrive } from '@googleapis/drive';

export const driveUpdateFileMetadata = createAction({
  auth: googleDriveAuth,
  name: 'drive_update_file_metadata',
  displayName: 'Update File Metadata (Rename)',
  description:
    "Rename a Drive file/folder or update its description or starred flag (metadata only).",
  audience: 'ai',
  aiMetadata: {
    description:
      "Renames a file/folder or updates its description or starred flag via a metadata-only PATCH. Use to rename or annotate a resource; this never changes the file's location — to re-parent use `drive_move_file`, and to replace the file's bytes use `drive_replace_file_content`. Safe to retry — re-applying the same values is a no-op.",
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File or Folder ID',
      description:
        'The ID of the file or folder to update. Resolve it via `drive_search_files` or `drive_get_file`.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'A new name for the file or folder. Leave empty to keep the current name.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A new description for the file or folder. Leave empty to keep the current description.',
      required: false,
    }),
    starred: Property.Checkbox({
      displayName: 'Starred',
      description: 'Whether to mark the file or folder as starred.',
      required: false,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const { file_id, name, description, starred, include_team_drives } =
      context.propsValue;

    const requestBody: { name?: string; description?: string; starred?: boolean } =
      {};
    if (name !== undefined && name !== null && name !== '') {
      requestBody.name = name;
    }
    if (description !== undefined && description !== null) {
      requestBody.description = description;
    }
    if (starred !== undefined && starred !== null) {
      requestBody.starred = starred;
    }

    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const response = await drive.files.update({
        fileId: file_id,
        supportsAllDrives: include_team_drives,
        requestBody,
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `File or folder not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied updating file ${file_id}. You may lack edit permission on this resource.`
        );
      }
      throw error;
    }
  },
});
