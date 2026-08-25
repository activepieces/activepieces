import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const compressPdfAction = createAction({
  auth: pdf4meAuth,
  name: 'compress_pdf',
  displayName: 'Compress PDF',
  description: 'Reduces the file size of a PDF document while maintaining readability.',
  audience: 'both',
  aiMetadata: {
    description: 'Reduces the size of a PDF via the PDF4me Optimize API, with an optional compression profile that trades size against quality (web, print, grayscale, or aggressive-maximum modes). Use when an agent needs to shrink a PDF for storage or delivery; the PDF file is required. A pure transformation that is idempotent — the same input and profile always yield the same optimized PDF with no stored side effect.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'The PDF file to compress.',
      required: true,
    }),
    optimizeProfile: Property.StaticDropdown({
      displayName: 'Compression Profile',
      description: 'Controls the trade-off between file size and output quality.',
      required: false,
      defaultValue: 'Default',
      options: {
        options: [
          { label: 'Default (balanced quality and size)', value: 'Default' },
          { label: 'Web (optimised for online viewing)', value: 'Web' },
          { label: 'Web Max (aggressive web optimisation)', value: 'WebMax' },
          { label: 'Print (optimised for printing)', value: 'Print' },
          { label: 'Print Max (aggressive print optimisation)', value: 'PrintMax' },
          { label: 'Print Gray (grayscale for print)', value: 'PrintGray' },
          { label: 'Compress (strong compression)', value: 'Compress' },
          { label: 'Compress Max (maximum compression)', value: 'CompressMax' },
          { label: 'Max (maximum size reduction)', value: 'Max' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, optimizeProfile } = context.propsValue;

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/Optimize',
      body: {
        docContent: file.data.toString('base64'),
        docName: file.filename,
        optimizeProfile: optimizeProfile ?? 'Default',
      },
    });

    const fileName = pdf4meCommon.fileNameFromHeaders(response.headers, file.filename);

    return {
      file_name: fileName,
      file_data_base64: Buffer.from(response.body).toString('base64'),
      success: true,
    };
  },
});
