import { createPiece } from "@activepieces/pieces-framework";
import { findInvoiceAction } from "./lib/actions/find-invoice";
import { findCustomerAction } from "./lib/actions/find-customer";
import { findPaymentAction } from "./lib/actions/find-payment";
import { createInvoiceAction } from "./lib/actions/create-invoice";
import { createExpenseAction } from "./lib/actions/create-expense";
import { createBillAction } from "./lib/actions/create-bill";
import { createVendorAction } from "./lib/actions/create-vendor";
import { findVendorAction } from "./lib/actions/find-vendor";
import { findAccountAction } from "./lib/actions/find-account";
import { recordPaymentAction } from "./lib/actions/record-payment";
import { recordBillPaymentAction } from "./lib/actions/record-bill-payment";
import { readAgingReportAction } from "./lib/actions/read-aging-report";
import { newInvoice } from "./lib/triggers/new-invoice";
import { newExpense } from "./lib/triggers/new-expense";
import { newCustomer } from "./lib/triggers/new-customer";
import { newDeposit } from "./lib/triggers/new-deposit";
import { newTransfer } from "./lib/triggers/new-transfer";
import { newOrUpdatedInvoice } from "./lib/triggers/new-or-updated-invoice";
import { paymentReceived } from "./lib/triggers/payment-received";
import { newBill } from "./lib/triggers/new-bill";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { quickbooksClient } from "./lib/common/client";
import { quickbooksAuth } from './lib/auth';
import { quickbooksSandboxAiActions } from './lib/actions/ai';

export const quickbooksSandbox = createPiece({
  displayName: "QuickBooks Online (Sandbox)",
  auth: quickbooksAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/quickbooks.png",
  authors: [ 'onyedikachi-david', 'sanket-a11y'],
  actions: [
    findInvoiceAction,
    findCustomerAction,
    findPaymentAction,
    createInvoiceAction,
    createExpenseAction,
    createBillAction,
    createVendorAction,
    findVendorAction,
    findAccountAction,
    recordPaymentAction,
    recordBillPaymentAction,
    readAgingReportAction,
    ...quickbooksSandboxAiActions,
    createCustomApiCallAction({
      auth:quickbooksAuth,
      baseUrl: (auth) => (auth ? quickbooksClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    })
  ],
  triggers: [
    newInvoice,
    newExpense,
    newCustomer,
    newDeposit,
    newTransfer,
    newOrUpdatedInvoice,
    paymentReceived,
    newBill
  ],
});
