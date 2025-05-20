import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { findInvoiceAction } from "./actions/find-invoice";
import { findCustomerAction } from "./actions/find-customer";
import { findPaymentAction } from "./actions/find-payment";
import { createInvoiceAction } from "./actions/create-invoice";
import { createExpenseAction } from "./actions/create-expense";
import { sendEstimateAction } from "./actions/send-estimate";
import { newInvoice } from "./triggers/new-invoice";
import { newExpense } from "./triggers/new-expense";
import { invoicePaid } from "./triggers/invoice-paid";
import { newCustomer } from "./triggers/new-customer";
import { newDeposit } from "./triggers/new-deposit";
import { newTransfer } from "./triggers/new-transfer";

const QUICKBOOKS_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QUICKBOOKS_TOKEN_URL_SANDBOX = 'https://sandbox-oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QUICKBOOKS_TOKEN_URL_PRODUCTION = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export const quickbooksAuth = PieceAuth.OAuth2({
  description: "Connect your QuickBooks account",
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      options: {
        options: [
          {
            label: 'Sandbox',
            value: 'sandbox-oauth.platform.intuit.com'
          },
          {
            label: 'Production',
            value: 'oauth.platform.intuit.com'
          }
        ]
      }
    })
  },
  authUrl: QUICKBOOKS_AUTH_URL,
  tokenUrl: 'https://{environment}/oauth2/v1/tokens/bearer',
  required: true,
  scope: [
    'com.intuit.quickbooks.accounting',
    'openid',
    'profile',
    'email',
    'phone',
    'address'
  ]
});

export const quickbooks = createPiece({
  displayName: "Quickbooks",
  auth: quickbooksAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/quickbooks.png",
  authors: [
    'onyedikachi-david'
  ],
  actions: [
    findInvoiceAction,
    findCustomerAction,
    findPaymentAction,
    createInvoiceAction,
    createExpenseAction,
    sendEstimateAction
  ],
  triggers: [
    newInvoice,
    newExpense,
    invoicePaid,
    newCustomer,
    newDeposit,
    newTransfer
  ],
});
