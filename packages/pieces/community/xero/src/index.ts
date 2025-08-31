import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
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

export const xeroAuth = PieceAuth.OAuth2({
  description: `
  1. Log in to Xero.
  2. Go to [Developer portal](https://developer.xero.com/app/manage/).
  3. Click on the App you want to integrate.
  4. On the left, click on \`Configuration\`.
  5. Enter your \`redirect url\`.
  6. Copy the \`Client Id\` and \`Client Secret\`.
  `,
  authUrl: 'https://login.xero.com/identity/connect/authorize',
  tokenUrl: 'https://identity.xero.com/connect/token',
  required: true,
  scope: [
    'openid',
    'profile',
    'email',
    'offline_access',
    'accounting.contacts',
    'accounting.transactions',
    'accounting.reports.read',
    'accounting.journals.read',
    'accounting.budgets.read',
    'accounting.attachments',
    'accounting.settings',
    'projects',
  ],
});

export const xero = createPiece({
  displayName: 'Xero',
  description: 'Beautiful accounting software',

  minimumSupportedRelease: '0.30.0',
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
