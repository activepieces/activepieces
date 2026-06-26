/* eslint-disable @typescript-eslint/no-explicit-any */

import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { Stream } from 'stream';

export const driveSaveFileAsPdf = createAction({
  auth: googleDriveAuth,
  name: 'drive_save_file_as_pdf',
  displayName: 'Save File as PDF',
  description: 'Save a document as PDF in a Google Drive folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Exports a native Google document to PDF and saves it as a new file in a target Drive folder. Use to produce a PDF rendition of a Google Doc/Sheet/Slides for sharing or archival (resolve the source and folder IDs via `drive_search_files`). Each call creates a new PDF file.',
    idempotent: false,
  },
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description:
        'The ID of the document to export. Resolve it via `drive_search_files`.',
      required: true,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the folder where the file will be exported. Resolve it via `drive_search_files`.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the new file (do not include the extension)',
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

    const documentId = context.propsValue.document_id;
    const folderId = context.propsValue.folder_id;
    const nameForNewFile = context.propsValue.name;

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const result = await drive.files.export(
      {
        fileId: documentId,
        mimeType: 'application/pdf',
      },
      {
        responseType: 'arraybuffer',
      }
    );

    const requestBody = {
      name: nameForNewFile + '.pdf',
      parents: [folderId],
    };
    const templateBuffer = Buffer.from(result.data as any, 'base64');

    const stream = new Stream.PassThrough().end(templateBuffer);

    const media = {
      mimeType: 'application/pdf',
      body: stream,
    };

    const file = await drive.files.create({
      requestBody,
      media: media,
      supportsAllDrives: context.propsValue.include_team_drives,
    });

    return file.data;
  },
});
