import { googleDriveAuth, createGoogleClient } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';
import { drive as googleDrive } from '@googleapis/drive';

export const driveMoveFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_move_file',
  displayName: 'Move File',
  description: 'Move a Drive file from its current folder(s) to a target folder.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Relocates a file to a target folder, detaching it from its current parents and attaching the new one. Use to reorganize a file by ID; to copy instead of move use drive_copy_file, and to rename without moving use drive_update_file_metadata. Safe to retry — repeating leaves the file in the same destination.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to move. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    folder_id: Property.ShortText({
      displayName: 'Destination Folder ID',
      description:
        'The ID of the folder to move the file into. Resolve it via drive_search_files; leave empty for the root of My Drive.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const fileId = context.propsValue.file_id;
    const folderId = context.propsValue.folder_id;

    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const file = await drive.files.get({
      fileId,
      supportsAllDrives: context.propsValue.include_team_drives,
      fields: 'id,parents',
    });

    const response = await drive.files.update({
      fileId: fileId,
      fields: '*',
      removeParents: file.data.parents?.join(','),
      addParents: folderId,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return response.data;
  },
});
