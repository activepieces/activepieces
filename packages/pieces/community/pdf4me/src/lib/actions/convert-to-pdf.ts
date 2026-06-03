import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const convertToPdfAction = createAction({
  auth: pdf4meAuth,
  name: 'convert_to_pdf',
  displayName: 'Convert File to PDF',
  description: 'Converts a Word, Excel, PowerPoint, or image file to PDF format.',
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
