import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { duplicateFileActionOutputSchema } from '../output-schemas';

export const duplicateFileAction = createAction({
  displayName: 'Duplicate File',
  auth: googleDriveAuth,
  name: 'duplicate_file',
  classification: 'WRITE',
  description: 'Copy a file into a folder, optionally as a Google Doc or Sheet.',
  audience: 'human',
  aiMetadata: { description: 'Copies an existing Drive file into a target folder under a new name, optionally converting it to a Google Sheet or Google Doc. Use to clone a file or create an editable Google-format copy. Requires the source file ID and destination folder ID. Not idempotent: each call creates a new copy.', idempotent: false },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file to copy.',
      required: true,
      placeholder: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    }),
    name: Property.ShortText({
      displayName: 'New File Name',
      description: 'Name of the copy.',
      required: true,
      placeholder: 'Report (copy)',
    }),
    folderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder that receives the copy.',
      required: true,
    }),
    mimeType: Property.StaticDropdown({
      displayName: 'Convert To',
      description: 'Empty keeps the original format.',
      required: false,
      advanced: true,
      options: {
        options: [
          {
            label: 'Google Sheets',
            value: 'application/vnd.google-apps.spreadsheet',
          },
          {
            label: 'Google Docs',
            value: 'application/vnd.google-apps.document',
          }
        ],
      },
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: duplicateFileActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const fileId = context.propsValue.fileId;
    const nameForNewFile = context.propsValue.name;
    const parentFolderId = context.propsValue.folderId;
    const mimeType = context.propsValue.mimeType;

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
