import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';

export const driveCreateFolder = createAction({
  auth: googleDriveAuth,
  name: 'drive_create_folder',
  displayName: 'Create Folder',
  description: 'Create a new empty folder in your Google Drive',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new empty folder in Google Drive, optionally nested under a parent folder (resolve the parent ID via `drive_search_files`). Use to set up a destination before uploading or moving files. Each call creates a distinct folder even with the same name, so retries duplicate.',
    idempotent: false,
  },
  props: {
    folder_name: Property.ShortText({
      displayName: 'Folder name',
      description: 'The name of the new folder',
      required: true,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the folder to create the new folder inside. Leave empty to create it in the root of My Drive. Resolve a folder ID with `drive_search_files`.',
      required: false,
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

    const response = await drive.files.create({
      requestBody: {
        mimeType: 'application/vnd.google-apps.folder',
        name: context.propsValue.folder_name,
        ...(context.propsValue.parent_folder_id
          ? { parents: [context.propsValue.parent_folder_id] }
          : {}),
      },
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return response.data;
  },
});
