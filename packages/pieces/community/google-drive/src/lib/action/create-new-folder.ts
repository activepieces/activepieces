import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../common';
import { common } from '../common';
import { google } from 'googleapis';

export const googleDriveCreateNewFolder = createAction({
  auth: googleDriveAuth,
  name: 'create_new_gdrive_folder',
  description: 'Create a new empty folder in your Google Drive',
  displayName: 'Create new folder',
  props: {
    folderName: Property.ShortText({
      displayName: 'Folder name',
      description: 'The name of the new folder',
      required: true,
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.create({
      requestBody: {
        mimeType: 'application/vnd.google-apps.folder',
        name: context.propsValue.folderName,
        ...(context.propsValue.parentFolder
          ? { parents: [context.propsValue.parentFolder] }
          : {}),
      },
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return response.data;
  },
});
