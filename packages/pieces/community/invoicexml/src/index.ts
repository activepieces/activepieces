import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { invoicexmlAuth } from './lib/auth';
import { INVOICEXML_BASE_URL } from './lib/common';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { validateInvoiceAction } from './lib/actions/validate-invoice';
import { convertInvoiceAction } from './lib/actions/convert-invoice';
import { extractInvoiceDataAction } from './lib/actions/extract-invoice-data';
import { renderInvoicePdfAction } from './lib/actions/render-invoice-pdf';

export const invoicexml = createPiece({
  displayName: 'InvoiceXML',
  description:
    'Create, validate and convert EU e-invoices: XRechnung, ZUGFeRD, Factur-X, UBL / Peppol BIS and CII.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/invoicexml.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['invoicexml-support'],
  auth: invoicexmlAuth,
  actions: [
    createInvoiceAction,
    validateInvoiceAction,
    convertInvoiceAction,
    extractInvoiceDataAction,
    renderInvoicePdfAction,
    createCustomApiCallAction({
      baseUrl: () => INVOICEXML_BASE_URL,
      auth: invoicexmlAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
