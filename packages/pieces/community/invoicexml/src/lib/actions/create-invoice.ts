import { createAction, Property } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from '../auth';
import {
  callInvoiceXml,
  formatExtension,
  INVOICE_FORMATS,
  outputFileName,
} from '../common';

export const createInvoiceAction = createAction({
  auth: invoicexmlAuth,
  name: 'create_invoice',
  classification: 'READ',
  displayName: 'Create E-Invoice',
  description:
    'Creates a validated e-invoice (XRechnung, ZUGFeRD, Factur-X, UBL / Peppol BIS or CII) from invoice data.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate an EN 16931 e-invoice file from structured invoice JSON in the chosen format; the result is validated against the official rules before it is returned. Use to produce a new invoice; to change the format of an existing invoice file use Convert E-Invoice instead. Nothing is stored or sent, so a retry returns the same file.',
    idempotent: true,
  },
  props: {
    format: Property.StaticDropdown({
      displayName: 'Format',
      description:
        'XRechnung for German public sector buyers, ZUGFeRD or Factur-X for a PDF with the XML embedded, UBL / Peppol BIS for the Peppol network.',
      required: true,
      options: {
        disabled: false,
        options: INVOICE_FORMATS.map(({ label, value }) => ({ label, value })),
      },
    }),
    invoice: Property.Json({
      displayName: 'Invoice',
      description:
        'The invoice as JSON: number, dates, seller, buyer and lines. Map the values from earlier steps into this template. All fields are described in the docs at [www.invoicexml.com/docs](https://www.invoicexml.com/docs).',
      required: true,
      defaultValue: {
        invoiceNumber: 'INV-2026-00045',
        issueDate: '2026-05-17',
        currency: 'EUR',
        seller: {
          name: 'Acme Engineering GmbH',
          vatIdentifier: 'DE123456789',
          postalAddress: {
            line1: 'Hauptstrasse 12',
            city: 'Berlin',
            postCode: '10115',
            country: 'DE',
          },
        },
        buyer: {
          name: 'Globex SAS',
          postalAddress: {
            line1: '15 rue de Rivoli',
            city: 'Paris',
            postCode: '75001',
            country: 'FR',
          },
        },
        paymentDetails: {
          paymentAccountIdentifier: 'DE89370400440532013000',
        },
        lines: [
          {
            quantity: 10,
            priceDetails: { netPrice: 150.0 },
            vatInformation: { rate: 19.0 },
            item: { name: 'Senior consulting' },
          },
        ],
      },
    }),
  },
  async run(context) {
    const { format, invoice } = context.propsValue;
    const extension = formatExtension(format);
    const data = await callInvoiceXml<Buffer>({
      apiKey: context.auth.secret_text,
      path: `/create/${format}`,
      body: { invoice },
      responseType: 'arraybuffer',
    });

    const invoiceNumber = (invoice as { invoiceNumber?: unknown }).invoiceNumber;
    const fileName = outputFileName(
      typeof invoiceNumber === 'string' ? invoiceNumber : undefined,
      `invoice-${format}`,
      extension
    );

    return {
      file: await context.files.write({ fileName, data }),
      file_name: fileName,
      format,
    };
  },
});
