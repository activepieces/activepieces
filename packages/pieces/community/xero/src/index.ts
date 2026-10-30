import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { xeroCreateContact } from './lib/actions/create-contact';
import { xeroCreateInvoice } from './lib/actions/create-invoice';
import { xeroAllocateCreditNoteToInvoice } from './lib/actions/allocate-credit-note-to-invoice';
import { xeroCreateBankTransfer } from './lib/actions/create-bank-transfer';
import { xeroCreateQuoteDraft } from './lib/actions/create-quote-draft';
import { xeroSendInvoiceEmail } from './lib/actions/send-invoice-email';
import { xeroCreateBill } from './lib/actions/create-bill';
import { xeroCreatePayment } from './lib/actions/create-payment';
import { xeroCreatePurchaseOrder } from './lib/actions/create-purchase-order';
import { xeroUpdatePurchaseOrder } from './lib/actions/update-purchase-order';
import { xeroUploadAttachment } from './lib/actions/upload-attachment';
import { xeroAddItemsToSalesInvoice } from './lib/actions/add-items-to-sales-invoice';
import { xeroCreateCreditNote } from './lib/actions/create-credit-note';
import { xeroCreateInventoryItem } from './lib/actions/create-inventory-item';
import { xeroCreateProject } from './lib/actions/create-project';
import { xeroUpdateSalesInvoice } from './lib/actions/update-sales-invoice';
import { xeroCreateRepeatingSalesInvoice } from './lib/actions/create-repeating-sales-invoice';
import { xeroFindContact } from './lib/actions/find-contact';
import { xeroFindInvoice } from './lib/actions/find-invoice';
import { xeroFindItem } from './lib/actions/find-item';
import { xeroFindPurchaseOrder } from './lib/actions/find-purchase-order';
import { xeroGetInvoiceHistory } from './lib/actions/get-invoice-history';
import { xeroCreateBankTransaction } from './lib/actions/create-bank-transaction';
import { xeroFindOrCreateContact } from './lib/actions/find-or-create-contact';
import { xeroListOrganisations } from './lib/actions/list-organisations';
import { xeroGetOrganisation } from './lib/actions/get-organisation';
import { xeroGetInvoice } from './lib/actions/get-invoice';
import { xeroSearchInvoices } from './lib/actions/search-invoices';
import { xeroDownloadInvoicePdf } from './lib/actions/download-invoice-pdf';
import { xeroGetContact } from './lib/actions/get-contact';
import { xeroArchiveContact } from './lib/actions/archive-contact';
import { xeroUpsertItem } from './lib/actions/upsert-item';
import { xeroSearchPayments } from './lib/actions/search-payments';
import { xeroDeletePayment } from './lib/actions/delete-payment';
import { xeroVoidInvoice } from './lib/actions/void-invoice';
import { xeroSearchBankTransactions } from './lib/actions/search-bank-transactions';
import { xeroCreateManualJournal } from './lib/actions/create-manual-journal';
import { xeroListAccounts } from './lib/actions/list-accounts';
import { xeroListTaxRates } from './lib/actions/list-tax-rates';
import { xeroListTrackingCategories } from './lib/actions/list-tracking-categories';
import { xeroGetProfitAndLoss } from './lib/actions/get-profit-and-loss';
import { xeroGetBalanceSheet } from './lib/actions/get-balance-sheet';
import { xeroGetBankSummary } from './lib/actions/get-bank-summary';
import { xeroGetTrialBalance } from './lib/actions/get-trial-balance';
import { xeroGetExecutiveSummary } from './lib/actions/get-executive-summary';
import { xeroGetAgedReceivables } from './lib/actions/get-aged-receivables';
import { xeroGetAgedPayables } from './lib/actions/get-aged-payables';
import { xeroCreateInvoiceAi } from './lib/actions/ai/create-invoice';
import { xeroUpdateInvoiceAi } from './lib/actions/ai/update-invoice';
import { xeroEmailInvoiceAi } from './lib/actions/ai/email-invoice';
import { xeroCreatePaymentAi } from './lib/actions/ai/create-payment';
import { xeroCreateCreditNoteAi } from './lib/actions/ai/create-credit-note';
import { xeroAllocateCreditNoteAi } from './lib/actions/ai/allocate-credit-note';
import { xeroCreateQuoteAi } from './lib/actions/ai/create-quote';
import { xeroCreatePurchaseOrderAi } from './lib/actions/ai/create-purchase-order';
import { xeroCreateBankTransactionAi } from './lib/actions/ai/create-bank-transaction';
import { xeroUploadAttachmentAi } from './lib/actions/ai/upload-attachment';
import { xeroNewContact } from './lib/triggers/new-contact';
import { xeroNewOrUpdatedContact } from './lib/triggers/new-or-updated-contact';
import { xeroNewSalesInvoice } from './lib/triggers/new-sales-invoice';
import { xeroUpdatedSalesInvoice } from './lib/triggers/updated-sales-invoice';
import { xeroNewBankTransaction } from './lib/triggers/new-bank-transaction';
import { xeroNewPayment } from './lib/triggers/new-payment';
import { xeroNewPurchaseOrder } from './lib/triggers/new-purchase-order';
import { xeroNewReconciledPayment } from './lib/triggers/new-reconciled-payment';
import { xeroUpdatedQuote } from './lib/triggers/updated-quote';
import { xeroNewBill } from './lib/triggers/new-bill';
import { xeroNewCreditNote } from './lib/triggers/new-credit-note';
import { xeroNewProject } from './lib/triggers/new-project';
import { xeroNewQuote } from './lib/triggers/new-quote';

export const xeroScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'accounting.contacts',
  'accounting.invoices',
  'accounting.payments',
  'accounting.banktransactions',
  'accounting.manualjournals',
  'accounting.reports.aged.read',
  'accounting.reports.balancesheet.read',
  'accounting.reports.banksummary.read',
  'accounting.reports.executivesummary.read',
  'accounting.reports.profitandloss.read',
  'accounting.reports.taxreports.read',
  'accounting.reports.trialbalance.read',
  'accounting.budgets.read',
  'accounting.attachments',
  'accounting.settings',
  'projects',
];

export const xeroAuth = PieceAuth.OAuth2({
  description: `
  1. Log in to Xero.
  2. Go to [Developer portal](https://developer.xero.com/app/manage/).
  3. Click on the App you want to integrate.
  4. On the left, click on \`Configuration\`.
  5. Enter your \`redirect url\`.
  6. Copy the \`Client Id\` and \`Client Secret\`.

  The connection requests Xero's granular scopes (for example \`accounting.invoices\` and \`accounting.payments\` instead of \`accounting.transactions\`), which apps created on or after 2 March 2026 require. Receipts, Expense Claims and Journals are not available on connections created with this version.
  `,
  authUrl: 'https://login.xero.com/identity/connect/authorize',
  tokenUrl: 'https://identity.xero.com/connect/token',
  required: true,
  scope: xeroScopes,
});

export const xero = createPiece({
  displayName: 'Xero',
  description: 'Beautiful accounting software',

  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/xero.png',
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'thejaachi'],
  categories: [PieceCategory.ACCOUNTING],
  auth: xeroAuth,
  actions: [
    xeroCreateContact,
    xeroCreateInvoice,
    xeroAllocateCreditNoteToInvoice,
    xeroCreateBankTransfer,
    xeroCreateQuoteDraft,
    xeroSendInvoiceEmail,
    xeroCreateBill,
    xeroCreatePayment,
    xeroCreatePurchaseOrder,
    xeroUpdatePurchaseOrder,
    xeroUploadAttachment,
    xeroAddItemsToSalesInvoice,
    xeroCreateCreditNote,
    xeroCreateInventoryItem,
    xeroCreateProject,
    xeroUpdateSalesInvoice,
    xeroCreateRepeatingSalesInvoice,
    xeroFindContact,
    xeroFindInvoice,
    xeroFindItem,
    xeroFindPurchaseOrder,
    xeroGetInvoiceHistory,
    xeroCreateBankTransaction,
    xeroFindOrCreateContact,
    xeroListOrganisations,
    xeroGetOrganisation,
    xeroGetInvoice,
    xeroSearchInvoices,
    xeroDownloadInvoicePdf,
    xeroGetContact,
    xeroArchiveContact,
    xeroUpsertItem,
    xeroSearchPayments,
    xeroDeletePayment,
    xeroVoidInvoice,
    xeroSearchBankTransactions,
    xeroCreateManualJournal,
    xeroListAccounts,
    xeroListTaxRates,
    xeroListTrackingCategories,
    xeroGetProfitAndLoss,
    xeroGetBalanceSheet,
    xeroGetBankSummary,
    xeroGetTrialBalance,
    xeroGetExecutiveSummary,
    xeroGetAgedReceivables,
    xeroGetAgedPayables,
    xeroCreateInvoiceAi,
    xeroUpdateInvoiceAi,
    xeroEmailInvoiceAi,
    xeroCreatePaymentAi,
    xeroCreateCreditNoteAi,
    xeroAllocateCreditNoteAi,
    xeroCreateQuoteAi,
    xeroCreatePurchaseOrderAi,
    xeroCreateBankTransactionAi,
    xeroUploadAttachmentAi,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.xero.com/api.xro/2.0',
      auth: xeroAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    xeroNewContact,
    xeroNewOrUpdatedContact,
    xeroNewSalesInvoice,
    xeroUpdatedSalesInvoice,
    xeroNewBankTransaction,
    xeroNewPayment,
    xeroNewPurchaseOrder,
    xeroNewReconciledPayment,
    xeroUpdatedQuote,
    xeroNewBill,
    xeroNewCreditNote,
    xeroNewProject,
    xeroNewQuote,
  ],
});
