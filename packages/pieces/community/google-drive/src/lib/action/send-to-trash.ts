import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth } from '../../';
import { common } from '../common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDriveTrashFile = createAction({
  auth: googleDriveAuth,
  name: 'trash_gdrive_file',
  description: 'Move a file to the trash in your Google Drive',
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
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

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
