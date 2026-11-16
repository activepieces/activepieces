import { createAction, Property } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from '../auth';
import {
  callInvoiceXml,
  CONVERSION_OPTIONS,
  fileForm,
  formatExtension,
  outputFileName,
} from '../common';

export const convertInvoiceAction = createAction({
  auth: invoicexmlAuth,
  name: 'convert_invoice',
  classification: 'READ',
  displayName: 'Convert E-Invoice',
  description:
    'Converts an e-invoice from one format to another, for example UBL to ZUGFeRD or Factur-X to CII.',
  audience: 'both',
  aiMetadata: {
    description:
      'Convert an existing e-invoice file between XRechnung, ZUGFeRD, Factur-X, UBL and CII; the converted invoice is validated before it is returned. Use when you already have an invoice file; to build one from data use Create E-Invoice. Nothing is stored or sent, so a retry returns the same file.',
    idempotent: true,
  },
  props: {
    conversion: Property.StaticDropdown({
      displayName: 'Conversion',
      description: 'The format of your file and the format you want.',
      required: true,
      options: {
        disabled: false,
        options: CONVERSION_OPTIONS,
      },
    }),
    file: Property.File({
      displayName: 'Invoice File',
      description: 'The XML file, or the PDF for ZUGFeRD and Factur-X.',
      required: true,
    }),
  },
  async run(context) {
    const { conversion, file } = context.propsValue;
    const target = conversion.split('/to/')[1];
    const data = await callInvoiceXml<Buffer>({
      apiKey: context.auth.secret_text,
      path: `/convert/${conversion}`,
      body: fileForm(file),
      responseType: 'arraybuffer',
    });

    const fileName = outputFileName(
      file.filename,
      `invoice-${target}`,
      formatExtension(target)
    );
    return {
      file: await context.files.write({ fileName, data }),
      file_name: fileName,
      format: target,
    };
  },
});
