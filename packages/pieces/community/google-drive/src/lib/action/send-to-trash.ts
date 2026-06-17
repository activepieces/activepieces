import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { google } from 'googleapis';

export const googleDriveTrashFile = createAction({
  auth: googleDriveAuth,
  name: 'trash_gdrive_file',
  description: 'Move a file to the trash in your Google Drive',
  audience: 'both',
  aiMetadata: { description: 'Moves a Drive file to the trash by its ID, a reversible deletion that can be restored from Drive. Use for safe removal instead of permanent deletion. Requires the file ID. Idempotent: re-trashing an already-trashed file leaves it in the same state.', idempotent: true },
  displayName: 'Trash file',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file to trash',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });
    const body_value = {
      trashed: true,
    };
    const response = await drive.files.update({
      fileId: context.propsValue.fileId,
      supportsAllDrives: context.propsValue.include_team_drives,
      requestBody: body_value,
    });

    return response.data;
  },
});
