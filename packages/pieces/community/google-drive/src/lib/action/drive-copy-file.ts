import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { googleDriveAuth, createGoogleClient } from '../auth';

export const driveCopyFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_copy_file',
  displayName: 'Copy File',
  description: 'Duplicate a file from Google Drive. Returns the new file ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copies an existing Drive file into a target folder under a new name, optionally converting it to a Google Sheet or Doc. Use to clone a file or make an editable Google-format copy; to relocate the original instead of copying use `drive_move_file`. Requires source file ID and destination folder ID. Each call creates a new copy.',
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to duplicate. Resolve it via `drive_search_files`.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new file',
      required: true,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the folder where the file will be duplicated. Resolve it via `drive_search_files`.',
      required: true,
    }),
    convert_to: Property.StaticDropdown({
      displayName: 'Duplicate as',
      description: 'If left unselected the file will be duplicated as it is',
      required: false,
      options: {
        options: [
          {
            label: 'Google Sheets',
            value: 'application/vnd.google-apps.spreadsheet',
          },
          {
            label: 'Google Docs',
            value: 'application/vnd.google-apps.document',
          },
        ],
      },
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

    const fileId = context.propsValue.file_id;
    const nameForNewFile = context.propsValue.name;
    const parentFolderId = context.propsValue.folder_id;
    const mimeType = context.propsValue.convert_to;

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const requestBody: any = {
      name: nameForNewFile,
      parents: [parentFolderId],
    };

    if (mimeType) {
      requestBody.mimeType = mimeType;
    }

    const response = await drive.files.copy({
      fileId,
      auth: authClient,
      requestBody,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    if (response.status !== 200) {
      throw new Error('Error duplicating file');
    }

    return response.data;
  },
});
