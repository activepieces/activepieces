import { createAction, Property } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from '../auth';
import {
  callInvoiceXml,
  fileForm,
  outputFileName,
  PDF_LANGUAGES,
} from '../common';

export const renderInvoicePdfAction = createAction({
  auth: invoicexmlAuth,
  name: 'render_invoice_pdf',
  classification: 'READ',
  displayName: 'Render Invoice as PDF',
  description:
    'Turns an XRechnung, UBL or CII invoice XML into a readable PDF.',
  audience: 'both',
  aiMetadata: {
    description:
      'Render an XRechnung, UBL or CII invoice XML as a human-readable PDF preview, for example to archive or forward a received XML invoice. The PDF is a visual copy without embedded XML; to create a ZUGFeRD or Factur-X PDF use Convert E-Invoice instead. Safe to retry.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'Invoice XML',
      description: 'An XRechnung, UBL or CII XML file.',
      required: true,
    }),
    language: Property.StaticDropdown({
      displayName: 'PDF Language',
      description: 'The language of the labels on the PDF.',
      required: false,
      defaultValue: 'en',
      options: {
        disabled: false,
        options: PDF_LANGUAGES,
      },
    }),
  },
  async run(context) {
    const { file, language } = context.propsValue;
    const data = await callInvoiceXml<Buffer>({
      apiKey: context.auth.secret_text,
      path: '/render/xml/to/pdf',
      body: fileForm(file, language ? { language } : {}),
      responseType: 'arraybuffer',
    });

    const fileName = outputFileName(file.filename, 'invoice', 'pdf');
    return {
      file: await context.files.write({ fileName, data }),
      file_name: fileName,
    };
  },
});
