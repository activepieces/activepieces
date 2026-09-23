/* eslint-disable @typescript-eslint/no-explicit-any */

import { googleDriveAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { Stream } from 'stream';
import { common } from '../common';
import { saveFileAsPdfActionOutputSchema } from '../output-schemas';

export const saveFileAsPdf = createAction({
  displayName: 'Save Document as PDF',
  auth: googleDriveAuth,
  name: 'save_file_as_pdf',
  classification: 'WRITE',
  description: 'Export a Google Doc, Sheet or Slides as a PDF into a folder.',
  audience: 'human',
  aiMetadata: { description: 'Exports a Google document to PDF and saves it as a new file in a target Drive folder. Use to produce a PDF rendition of a Google Doc/Sheet/Slides for sharing or archival. Requires the source document ID and destination folder ID. Not idempotent: each call creates a new PDF file.', idempotent: false },
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the Google Doc, Sheet or Slides to export.',
      required: true,
      placeholder: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    }),
    folderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder that receives the PDF.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'File Name',
      description: 'Without the extension; .pdf is added.',
      required: true,
      placeholder: 'Quarterly report',
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: saveFileAsPdfActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const documentId = context.propsValue.documentId;
    const folderId = context.propsValue.folderId;
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
