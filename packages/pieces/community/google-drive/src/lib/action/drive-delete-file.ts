import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { drive as googleDrive } from '@googleapis/drive';

export const driveDeleteFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_delete_file',
  displayName: 'Delete File Permanently',
  description: 'Permanently delete a Drive file by ID, bypassing the trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a file by ID, bypassing the trash — unrecoverable. Use only when permanent removal is intended; for reversible deletion prefer drive_trash_file. A repeat call fails because the file no longer exists.',
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to permanently delete. Resolve it via drive_search_files or drive_get_file.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const response = await drive.files.delete({
      fileId: context.propsValue.file_id,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return response.data;
  },
});
