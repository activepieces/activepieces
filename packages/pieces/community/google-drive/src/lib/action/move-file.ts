import { googleDriveAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const moveFileAction = createAction({
  auth: googleDriveAuth,
  name: 'google-drive-move-file',
  displayName: 'Move File',
  description: 'Moves a file from one folder to another.',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'You can use **Search Folder/File** action to retrive ID.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
    folderId: common.properties.parentFolder,
  },
  async run(context) {
    const fileId = context.propsValue.fileId;
    const folderId = context.propsValue.folderId;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

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
