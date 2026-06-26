import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { drive as googleDrive } from '@googleapis/drive';

export const driveTrashFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_trash_file',
  displayName: 'Trash File',
  description: 'Move a Drive file to the trash by ID (reversible deletion).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a file to the trash by ID — a reversible deletion restorable from Drive. Use for safe removal; for irreversible removal use drive_delete_file, and to restore use drive_untrash_file. Safe to retry — re-trashing leaves it trashed.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to trash. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });
    const body_value = {
      trashed: true,
    };
    const response = await drive.files.update({
      fileId: context.propsValue.file_id,
      supportsAllDrives: context.propsValue.include_team_drives,
      requestBody: body_value,
    });

    return response.data;
  },
});
