import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const convertToPdfAction = createAction({
  auth: pdf4meAuth,
  name: 'convert_to_pdf',
  displayName: 'Convert File to PDF',
  description: 'Converts a Word, Excel, PowerPoint, or image file to PDF format.',
  audience: 'both',
  aiMetadata: {
    description: 'Converts a single office or image file (DOCX/DOC, XLSX/XLS, PPTX/PPT, PNG/JPG/GIF/BMP/TIFF) into a PDF via the PDF4me API. Use when an agent needs a non-PDF document rendered as PDF; the input file is required. A pure conversion that is idempotent — the same input always yields the same PDF with no stored side effect.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'The file to convert. Supported formats: DOCX, DOC, XLSX, XLS, PPTX, PPT, PNG, JPG, JPEG, GIF, BMP, TIFF.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Output Filename',
      description:
        'Name for the resulting PDF file (without the .pdf extension). Defaults to the original filename.',
      required: false,
    }),
  },
  async run(context) {
    const { file, filename } = context.propsValue;
    const outputName = filename ?? file.filename.replace(/\.[^.]+$/, '');

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/ConvertToPdf',
      body: {
        docContent: file.data.toString('base64'),
        docName: file.filename,
      },
    });

    const fileName = pdf4meCommon.fileNameFromHeaders(
      response.headers,
      `${outputName}.pdf`,
    );

    return {
      file_name: fileName,
      file_data_base64: Buffer.from(response.body).toString('base64'),
      success: true,
    };
  },
});
