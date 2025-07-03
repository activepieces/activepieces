import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth } from '../../';
import { common } from '../common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDriveDeleteFile = createAction({
  auth: googleDriveAuth,
  name: 'delete_gdrive_file',
  description: 'Delete permanently a file from your Google Drive',
  displayName: 'Delete file',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file to delete',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.delete({
      fileId: context.propsValue.fileId,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return response.data;
  },
});
