import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { createNewGdriveFileActionOutputSchema } from '../output-schemas';

export const googleDriveCreateNewTextFile = createAction({
  auth: googleDriveAuth,
  name: 'create_new_gdrive_file',
  description: 'Create a new text file in your Google Drive from text',
  audience: 'both',
  aiMetadata: { description: 'Creates a new file in Google Drive from inline text content as plain text, CSV, or XML, optionally inside a parent folder. Use when an agent has generated text it needs to persist as a Drive file. Not idempotent: each call creates a new file.', idempotent: false },
  displayName: 'Create new file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the new text file',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to add to file',
      required: true,
    }),
    fileType: Property.StaticDropdown({
      displayName: 'Content type',
      description: 'Select file type',
      required: true,
      defaultValue: 'plain/text',
      options: {
        options: [
          {
            label: 'Text',
            value: 'plain/text',
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

    const response = await drive.files.create({
      requestBody: {
        name: context.propsValue.fileName,
        mimeType: context.propsValue.fileType,
        ...(context.propsValue.parentFolder
          ? { parents: [context.propsValue.parentFolder] }
          : {}),
      },
      media: {
        mimeType: context.propsValue.fileType,
        body: context.propsValue.text,
      },
      supportsAllDrives: context.propsValue.include_team_drives ?? false,
      fields: 'id, name, mimeType, kind',
    });

    return response.data;
  },
});
