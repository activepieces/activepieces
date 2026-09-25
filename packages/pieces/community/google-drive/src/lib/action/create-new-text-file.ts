import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { createNewGdriveFileActionOutputSchema } from '../output-schemas';

export const googleDriveCreateNewTextFile = createAction({
  auth: googleDriveAuth,
  name: 'create_new_gdrive_file',
  classification: 'WRITE',
  description: 'Create a text, CSV or XML file from text you enter.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new file in Google Drive from inline text content as plain text, CSV, or XML, optionally inside a parent folder. Use when an agent has generated text it needs to persist as a Drive file. Not idempotent: each call creates a new file.', idempotent: false },
  displayName: 'Create File from Text',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Include the extension, for example report.csv.',
      required: true,
      placeholder: 'report.txt',
    }),
    text: Property.LongText({
      displayName: 'Content',
      description: 'The text written into the file.',
      required: true,
    }),
    fileType: Property.StaticDropdown({
      displayName: 'File Type',
      description: 'Plain text, CSV or XML. Match the extension in the file name.',
      required: true,
      defaultValue: 'text/plain',
      options: {
        options: [
          {
            label: 'Plain Text (TXT)',
            value: 'text/plain',
          },
          {
            label: 'CSV',
            value: 'text/csv',
          },
          {
            label: 'XML',
            value: 'text/xml',
          },
        ],
      },
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: createNewGdriveFileActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    // Normalize the legacy 'plain/text' value saved by existing flows to the
    // valid 'text/plain' MIME type Google Drive expects.
    const mimeType =
      context.propsValue.fileType === 'plain/text'
        ? 'text/plain'
        : context.propsValue.fileType;

    const response = await drive.files.create({
      requestBody: {
        name: context.propsValue.fileName,
        mimeType,
        ...(context.propsValue.parentFolder
          ? { parents: [context.propsValue.parentFolder] }
          : {}),
      },
      media: {
        mimeType,
        body: context.propsValue.text,
      },
      supportsAllDrives: context.propsValue.include_team_drives ?? false,
      fields: 'id, name, mimeType, kind',
    });

    return response.data;
  },
});
