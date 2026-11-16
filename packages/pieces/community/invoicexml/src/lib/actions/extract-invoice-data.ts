import { createAction, Property } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from '../auth';
import { callInvoiceXml, fileForm } from '../common';

export const extractInvoiceDataAction = createAction({
  auth: invoicexmlAuth,
  name: 'extract_invoice_data',
  classification: 'READ',
  displayName: 'Extract Invoice Data',
  description:
    'Reads the invoice data embedded in a ZUGFeRD or Factur-X PDF and returns it as JSON.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the structured invoice embedded in a ZUGFeRD or Factur-X hybrid PDF and return it as JSON (seller, buyer, lines, totals). Use to book or process a received hybrid PDF invoice. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    file: Property.File({
      displayName: 'Invoice PDF',
      description: 'A ZUGFeRD or Factur-X PDF.',
      required: true,
    }),
  },
  async run(context) {
    const result = await callInvoiceXml<{ invoice: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      path: '/extract/json',
      body: fileForm(context.propsValue.file),
      responseType: 'json',
    });
    return result.invoice;
  },
});
