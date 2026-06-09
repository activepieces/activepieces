import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { common } from '../common';

export const googleDriveGetResourceById = createAction({
  auth: googleDriveAuth,
  name: 'get-file-or-folder-by-id',
  displayName: 'Get File Information',
  description: 'Get a file folder for files/sub-folders',
  audience: 'both',
  aiMetadata: { description: 'Fetches metadata for a single file or folder in Google Drive by its exact ID (name, MIME type, parents, etc.). Use when an agent already has a file/folder ID and needs its details. Read-only and idempotent. Requires the resource ID, not a name or path.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'File / Folder Id',
      description: 'The Id of the file/folder to search for.',
      required: true,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const drive = google.drive({ version: 'v3', auth: authClient });
    const response = await drive.files.get({
      fileId: context.propsValue.id,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    if (response.data) {
      return response.data;
    } else {
      console.log('The specified ID corresponds to a folder. Returning null.');
      return null;
    }
  },
});
