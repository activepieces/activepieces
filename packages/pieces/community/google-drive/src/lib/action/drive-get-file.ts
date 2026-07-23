import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';

export const driveGetFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_get_file',
  displayName: 'Get File or Folder',
  description: 'Get a file folder for files/sub-folders',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches metadata for a single file or folder by its exact ID (name, MIME type, parents, owners, links). Use when you already have an ID (e.g. from a trigger or `drive_search_files`) and need its details, including its parent folder IDs. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File / Folder ID',
      description:
        'The ID of the file/folder to fetch. Resolve it via `drive_search_files` or `drive_list_files`.',
      required: true,
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });
    const response = await drive.files.get({
      fileId: context.propsValue.file_id,
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
