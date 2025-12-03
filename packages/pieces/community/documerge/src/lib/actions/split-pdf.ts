import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { documergeAuth } from '../common/auth';
import { DocuMergeClient } from '../common/client';

export const splitPdf = createAction({
  auth: documergeAuth,
  name: 'split_pdf',
  displayName: 'Split PDF',
  description: 'Extract or remove specific pages from a PDF file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the PDF file',
      required: true,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the PDF file (must be a valid URL)',
      required: false,
    }),
    contents: Property.LongText({
      displayName: 'Contents',
      description: 'Base64 encoded file contents',
      required: false,
    }),
    extract: Property.Array({
      displayName: 'Pages to Extract',
      description: 'Page numbers or ranges to extract (e.g., "1", "2-5", "1, 3-5")',
      required: false,
    }),
    remove: Property.Array({
      displayName: 'Pages to Remove',
      description: 'Page numbers or ranges to remove (e.g., "1", "2-5", "1, 3-5")',
      required: false,
    }),
  },
  async run(context) {
    const { fileName, fileUrl, contents, extract, remove } = context.propsValue;

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
      (body['file'] as Record<string, unknown>)['contents'] = contents;
    }

    if (extract && extract.length > 0) {
      body['extract'] = extract.filter((e): e is string => typeof e === 'string');
    }

    if (remove && remove.length > 0) {
      body['remove'] = remove.filter((r): r is string => typeof r === 'string');
    }

    const fileData = await client.makeBinaryRequest(
      HttpMethod.POST,
      '/api/tools/pdf/split',
      body
    );

    const pdfFileName = fileName.endsWith('.pdf')
      ? fileName.replace('.pdf', '_split.pdf')
      : `${fileName}_split.pdf`;

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

