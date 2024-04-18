import { Property, createAction } from '@activepieces/pieces-framework';
import { googleDriveAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { downloadFileFromDrive } from '../common/get-file-content';

export const setPublicAccess = createAction({
  auth: googleDriveAuth,
  name: 'set_public_access',
  description: 'Set public access for a file or folder',
  displayName: 'Set public access',
  props: {
    fileId: Property.ShortText({
      displayName: 'File or Folder ID',
      description: 'The ID of the file or folder to update permissions for',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const fileId = context.propsValue.fileId;

    const drive = google.drive({ version: 'v3', auth: authClient });
    const permission = {
      role: 'reader',
      type: 'anyone',
    };
    const res = await drive.permissions.create({
      fileId: fileId,
      requestBody: permission,
    });

    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name,webContentLink',
    });
    const content = await downloadFileFromDrive(
      context.auth,
      context.files,
      fileId,
      file.data.name!
    );
    return { ...res.data, downloadUrl: content };
  },
});
