import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth, WAFEQ_API_BASE_URL } from '../common/auth';
import { wafeqProps } from '../common/props';

export const downloadInvoicePdf = createAction({
  auth: wafeqAuth,
  name: 'download_invoice_pdf',
  displayName: 'Download Invoice PDF',
  description:
    'Download an invoice as a PDF. You can attach the file to a Gmail / Outlook email, save it to Google Drive or Dropbox, or upload it anywhere else in the flow.',
  props: {
    invoice: wafeqProps.invoiceDropdown({
      description: 'Pick which invoice to download.',
    }),
    file_name: Property.ShortText({
      displayName: 'File Name (optional)',
      description:
        'What to call the downloaded PDF. Leave blank to use "invoice-<id>.pdf". The ".pdf" extension is added automatically if you don\'t include it.',
      required: false,
    }),
  },
  async run(context) {
    const { invoice, file_name } = context.propsValue;
    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url: `${WAFEQ_API_BASE_URL}/invoices/${invoice}/download/`,
      headers: {
        Authorization: `Api-Key ${context.auth.secret_text}`,
      },
      responseType: 'arraybuffer',
    });
    const pdfFileName =
      file_name && file_name.trim().length > 0
        ? file_name.endsWith('.pdf')
          ? file_name
          : `${file_name}.pdf`
        : `invoice-${invoice}.pdf`;
    const fileRef = await context.files.write({
      fileName: pdfFileName,
      data: Buffer.from(response.body as unknown as ArrayBuffer),
    });
    return {
      invoice_id: invoice,
      file_name: pdfFileName,
      file: fileRef,
      size_bytes: (response.body as unknown as ArrayBuffer).byteLength,
    };
  },
});
