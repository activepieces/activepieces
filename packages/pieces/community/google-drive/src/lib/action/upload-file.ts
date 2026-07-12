import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import { drive as googleDrive } from '@googleapis/drive';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { common } from '../common';
import { uploadGdriveFileActionOutputSchema } from '../output-schemas';

export const googleDriveUploadFile = createAction({
  auth: googleDriveAuth,
  name: 'upload_gdrive_file',
  description: 'Upload a file in your Google Drive',
  audience: 'both',
  aiMetadata: { description: 'Uploads a binary file (from a URL or base64 input) into Google Drive, optionally inside a parent folder. Use to store an existing file or attachment in Drive; the MIME type is inferred from the file extension. Not idempotent: each call creates a new file.', idempotent: false },
  displayName: 'Upload file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
      stream: true,
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: uploadGdriveFileActionOutputSchema,
  async run(context) {
    const fileData = context.propsValue.file;
    const mimeType = fileData.mimetype ?? (mime.lookup(fileData.filename) || 'application/octet-stream');

    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    const response = await drive.files.create({
      requestBody: {
        name: context.propsValue.fileName,
        ...(context.propsValue.parentFolder
          ? { parents: [context.propsValue.parentFolder] }
          : {}),
      },
      media: {
        mimeType,
        body: await fileData.stream(),
      },
      supportsAllDrives: context.propsValue.include_team_drives ?? false,
      fields: 'id, name, mimeType, kind',
    });

    return response.data;
  },
});
