import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { quickbooksAuth } from './lib/auth';
import { quickbooksCommon } from './lib/common';

// Import actions
import { findInvoice } from './lib/actions/find-invoice';
import { findCustomer } from './lib/actions/find-customer';
import { findPayment } from './lib/actions/find-payment';
import { createInvoice } from './lib/actions/create-invoice';
import { createExpense } from './lib/actions/create-expense';
import { sendEstimate } from './lib/actions/send-estimate';

// Import triggers
import { newInvoiceCreated } from './lib/triggers/new-invoice-created';
import { newExpenseLogged } from './lib/triggers/new-expense-logged';
import { invoicePaid } from './lib/triggers/invoice-paid';
import { newCustomerCreated } from './lib/triggers/new-customer-created';
import { newBankTransaction } from './lib/triggers/new-bank-transaction';

export const quickbooks = createPiece({
  displayName: 'QuickBooks',
  description: 'Accounting software for managing invoices, expenses, payroll, and cash flow',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
  categories: [PieceCategory.ACCOUNTING],
  auth: quickbooksAuth,
  minimumSupportedRelease: '0.30.0',
  authors: ['activepieces-community'],
  actions: [
    findInvoice,
    findCustomer,
    findPayment,
    createInvoice,
    createExpense,
    sendEstimate,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        // Add minorversion to the URL since we can't use queryParams
        return `${quickbooksCommon.getApiUrl(auth as OAuth2PropertyValue)}?minorversion=65`;
      },
      auth: quickbooksAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };
      },
    }),
  ],
  triggers: [
    newInvoiceCreated,
    newExpenseLogged,
    invoicePaid,
    newCustomerCreated,
    newBankTransaction,
  ],
});
