import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { wafeqAuth, WAFEQ_API_BASE_URL } from './lib/common/auth';
import { createInvoice } from './lib/actions/create-invoice';
import { reportInvoiceToTaxAuthority } from './lib/actions/report-invoice-to-tax-authority';
import { createContact } from './lib/actions/create-contact';
import { findContact } from './lib/actions/find-contact';
import { createBill } from './lib/actions/create-bill';
import { recordPayment } from './lib/actions/record-payment';
import { createSimplifiedInvoice } from './lib/actions/create-simplified-invoice';
import { createCreditNote } from './lib/actions/create-credit-note';
import { createQuote } from './lib/actions/create-quote';
import { convertQuoteToInvoice } from './lib/actions/convert-quote-to-invoice';
import { downloadInvoicePdf } from './lib/actions/download-invoice-pdf';
import { createItem } from './lib/actions/create-item';
import { listItems } from './lib/actions/list-items';
import { listAccounts } from './lib/actions/list-accounts';
import { newInvoice } from './lib/triggers/new-invoice';
import { newBill } from './lib/triggers/new-bill';
import { newContact } from './lib/triggers/new-contact';
import { newPaymentReceived } from './lib/triggers/new-payment-received';

export { wafeqAuth } from './lib/common/auth';

export const wafeq = createPiece({
  displayName: 'Wafeq',
  description:
    'Cloud accounting software for invoicing, bills, expenses, and tax reporting (ZATCA, UAE FTA).',
  auth: wafeqAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wafeq.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['sanket-a11y'],
  actions: [
    createInvoice,
    reportInvoiceToTaxAuthority,
    createContact,
    findContact,
    createBill,
    recordPayment,
    createSimplifiedInvoice,
    createCreditNote,
    createQuote,
    convertQuoteToInvoice,
    downloadInvoicePdf,
    createItem,
    listItems,
    listAccounts,
    createCustomApiCallAction({
      baseUrl: () => WAFEQ_API_BASE_URL,
      auth: wafeqAuth,
      authMapping: async (auth) => ({
        Authorization: `Api-Key ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    newInvoice,
    newBill,
    newContact,
    newPaymentReceived,
  ],
});
