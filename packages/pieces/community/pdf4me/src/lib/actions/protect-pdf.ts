import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf4meAuth } from '../auth';
import { pdf4meCommon } from '../common';

export const protectPdfAction = createAction({
  auth: pdf4meAuth,
  name: 'protect_pdf',
  displayName: 'Protect PDF with Password',
  description: 'Adds password protection to a PDF file so only authorised users can open it.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'The PDF file to protect with a password.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'The password users will need to open the protected PDF.',
      required: true,
    }),
    pdfPermission: Property.StaticDropdown({
      displayName: 'PDF Permissions',
      description: 'Permissions granted to users who open the protected PDF.',
      required: false,
      defaultValue: 'All',
      options: {
        options: [
          { label: 'All (no restrictions)', value: 'All' },
          { label: 'None (no permissions)', value: 'None' },
          { label: 'Copy', value: 'Copy' },
          { label: 'Annotate', value: 'Annotate' },
          { label: 'Fill Forms', value: 'Fill Forms' },
          { label: 'Support Disabilities', value: 'Support Disabilities' },
          { label: 'Assemble', value: 'Assemble' },
          { label: 'Digital Print', value: 'Digital Print' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, password, pdfPermission } = context.propsValue;

    const response = await pdf4meCommon.callFileApi({
      apiKey: context.auth.secret_text,
      endpoint: '/api/v2/Protect',
      body: {
        docContent: file.data.toString('base64'),
        docName: file.filename,
        password,
        pdfPermission: pdfPermission ?? 'All',
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
