import { googleDriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { downloadFileFromDrive } from '../common/get-file-content';

export const driveDownloadFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_download_file',
  displayName: 'Download File Content',
  description: 'Read a selected file from google drive file',
  audience: 'ai',
  aiMetadata: {
    description:
      "Downloads a Drive file's bytes by ID and returns a file reference; native Google files (Docs/Sheets/Slides) are auto-exported to their default Office format. Use to retrieve content of a file you have the ID for (obtain it from `drive_search_files` or `drive_get_file`). Read-only.",
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the file to download. Resolve it via `drive_search_files` or `drive_get_file`.',
      required: true,
    }),
    destination_file_name: Property.ShortText({
      displayName: 'Destination File name',
      required: false,
    }),
  },
  run: async ({ auth, propsValue, files }) => {
    return downloadFileFromDrive(
      auth,
      files,
      propsValue.file_id,
      propsValue.destination_file_name
    );
  },
});
