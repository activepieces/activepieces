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
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role to assign for public access',
      options: {
        options: [
          { label: 'Reader', value: 'reader' },
          { label: 'Commenter', value: 'commenter' },
          { label: 'Editor', value: 'writer' },
        ],
      },
      defaultValue: 'reader',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const fileId = context.propsValue.fileId;
    const role = context.propsValue.role;

    const drive = google.drive({ version: 'v3', auth: authClient });
    const permission = {
      role: role,
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
