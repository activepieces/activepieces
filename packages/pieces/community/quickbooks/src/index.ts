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

export const quickbooksAuth = PieceAuth.OAuth2({
	description: 'You can find Company ID under **settings->Additional Info**.',
	required: true,
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			required: true,
		}),
		environment: Property.StaticDropdown({
			displayName: 'Environment',
			required: true,
			options: {
				options: [
					{
						label: 'Sandbox',
						value: 'sandbox',
					},
					{
						label: 'Production',
						value: 'production',
					},
				],
			},
		}),
	},
	authUrl: 'https://appcenter.intuit.com/connect/oauth2',
	tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
	scope: ['com.intuit.quickbooks.accounting'],
});

export const quickbooks = createPiece({
  displayName: "Quickbooks Online",
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
