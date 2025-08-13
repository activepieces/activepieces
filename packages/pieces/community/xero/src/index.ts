import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { CreateContact } from './lib/actions/create-contact';
import { createInvoice } from './lib/actions/create-invoice';
import { allocateCreditNoteToInvoice } from './lib/actions/allocate-credit-note-to-invoice';
import { addItemsToExistingSalesInvoice } from './lib/actions/add-items-to-existing-sales-invoice';
import { createBankTransfer } from './lib/actions/create-bank-transfer';
import { createBill } from './lib/actions/create-bill';
import { createCreditNote } from './lib/actions/create-credit-note';
import { createInventoryItem } from './lib/actions/create-inventory-item';
import { createNewQuoteDraft } from './lib/actions/create-new-quote-draft';
import { createPayment } from './lib/actions/create-payment';
import { createProject } from './lib/actions/create-project';
import { createPurchaseOrder } from './lib/actions/create-purchase-order';
import { createRepeatingSalesInvoice } from './lib/actions/create-repeating-sales-invoice';
import { findContact } from './lib/actions/find-contact';
import { findInvoice } from './lib/actions/find-invoice';
import { findItem } from './lib/actions/find-item';
import { findPurchaseOrder } from './lib/actions/find-purchase-order';
import { sendSalesInvoiceByEmail } from './lib/actions/send-sales-invoice-by-email';
import { updatePurchaseOrder } from './lib/actions/update-purchase-order';
import { updateSalesInvoice } from './lib/actions/update-sales-invoice';
import { uploadAttachment } from './lib/actions/upload-attachment';

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
    'accounting.transactions',
    'accounting.transactions.read',
    'accounting.reports.read',
    'accounting.reports.tenninetynine.read',
    'accounting.budgets.read',
    'accounting.journals.read',
    'accounting.settings',
    'accounting.settings.read',
    'accounting.contacts',
    'accounting.contacts.read',
    'accounting.attachments',
    'accounting.attachments.read',
    'assets',
    'assets.read',
    'files',
    'payroll.employees',
    'files.read',
    'payroll.payruns',
    'payroll.employees.read',
    'payroll.payruns.read',
    'payroll.payslip',
    'payroll.payslip.read',
    'payroll.settings',
    'payroll.settings.read',
    'payroll.timesheets',
    'payroll.timesheets.read',
    'projects',
    'projects.read',
  ],
});

export const xero = createPiece({
  displayName: 'Xero',
  description: 'Beautiful accounting software',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/xero.png',
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  categories: [PieceCategory.ACCOUNTING],
  auth: xeroAuth,
  actions: [
    addItemsToExistingSalesInvoice,
    allocateCreditNoteToInvoice,
    createBankTransfer,
    createBill,
    CreateContact,
    createCreditNote,
    createInventoryItem,
    createInvoice,
    createNewQuoteDraft,
    createPayment,
    createProject,
    createPurchaseOrder,
    createRepeatingSalesInvoice,
    findContact,
    findInvoice,
    findItem,
    findPurchaseOrder,
    sendSalesInvoiceByEmail,
    updatePurchaseOrder,
    updateSalesInvoice,
    uploadAttachment,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.xero.com/api.xro/2.0',
      auth: xeroAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
