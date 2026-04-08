import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { documergeAuth } from '../common/auth';
import { DocuMergeClient } from '../common/client';

export const convertFileToPdf = createAction({
  auth: documergeAuth,
  name: 'convert_file_to_pdf',
  displayName: 'Convert File to PDF',
  description: 'Convert a given file to PDF',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the file to convert',
      required: true,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the file to convert (must be a valid URL)',
      required: false,
    }),
    contents: Property.LongText({
      displayName: 'Contents',
      description: 'Additional content to include',
      required: false,
    }),
  },
  async run(context) {
    const { fileName, fileUrl, contents } = context.propsValue;

    if (!fileName) {
      throw new Error('File name is required');
    }

    const client = new DocuMergeClient(context.auth.secret_text);

    const body: Record<string, unknown> = {
      file: {
        name: fileName,
      },
    };

    if (fileUrl) {
      (body['file'] as Record<string, unknown>)['url'] = fileUrl;
    }

    if (contents) {
      body['contents'] = contents;
    }

    const fileData = await client.makeBinaryRequest(
      HttpMethod.POST,
      '/api/tools/pdf/convert',
      body
    );

    const pdfFileName = fileName.endsWith('.pdf')
      ? fileName
      : `${fileName.replace(/\.[^/.]+$/, '')}.pdf`;

    const fileUrlResult = await context.files.write({
      fileName: pdfFileName,
      data: Buffer.from(fileData),
    });

    return {
      success: true,
      fileName: pdfFileName,
      fileUrl: fileUrlResult,
      format: 'pdf',
      size: fileData.byteLength,
    };
  },
});

