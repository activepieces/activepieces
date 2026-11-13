import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateSalesReceiptOutputSchema } from '../../../output-schemas';

export const createSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_sales_receipt',
	outputSchema: quickbooksSandboxCreateSalesReceiptOutputSchema,
	displayName: 'Create Sales Receipt',
	description: 'Creates a sales receipt.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a sales receipt, a sale paid in full on the spot (use Create Invoice when the customer pays later). Needs at least one line; item ids come from List Items and the optional customer id from List Customers. Not idempotent: each call records a new sale.',
		idempotent: false,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer ID',
			description: 'Optional QuickBooks customer id. Use List Customers to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "SalesItemLineDetail", "Amount": 50, "Description": "Consulting", "SalesItemLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}}]. Amount must equal Qty x UnitPrice.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the sales receipt, YYYY-MM-DD. Defaults to today.',
		}),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'QuickBooks payment method id (cash, check, credit card). Use List Payment Methods to find it.',
		}),
		depositToAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Deposit To Account ID',
			description: 'Account the money is deposited to, e.g. a bank account. Use List Accounts to find it. Defaults to Undeposited Funds.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'Reference number shown on the sales receipt. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'Email address the sales receipt is sent to with Send Sales Receipt.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'Message to the customer, shown on the sales receipt.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal note, not shown to the customer.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { customerId, lines, txnDate, paymentMethodId, depositToAccountId, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'SalesReceipt',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
						DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
						DocNumber: docNumber,
						BillEmail: billEmail ? { Address: billEmail } : undefined,
						CustomerMemo: customerMemo ? { value: customerMemo } : undefined,
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
