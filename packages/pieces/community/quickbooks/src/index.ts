import { createPiece, PieceAuth, Property, OAuth2AuthorizationMethod } from "@activepieces/pieces-framework";
import { OAuth2GrantType } from "@activepieces/shared";
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
// const QUICKBOOKS_TOKEN_URL_SANDBOX = 'https://sandbox-oauth.platform.intuit.com/oauth2/v1/tokens/bearer'; // Commenting out old sandbox URL
const QUICKBOOKS_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'; // Using one token URL

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
            // value no longer directly constructs the URL, but still useful for user selection and potentially other logic
            value: 'sandbox'
          },
          {
            label: 'Production',
            value: 'production'
          }
        ]
      }
    })
  },
  authUrl: QUICKBOOKS_AUTH_URL,
  tokenUrl: QUICKBOOKS_TOKEN_URL, // Using the unified token URL
  required: true,
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  scope: [
    'com.intuit.quickbooks.accounting'
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
