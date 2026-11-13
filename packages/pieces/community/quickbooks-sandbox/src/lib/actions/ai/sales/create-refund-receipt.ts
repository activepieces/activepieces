import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateRefundReceiptOutputSchema } from '../../../output-schemas';

export const createRefundReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_refund_receipt',
	outputSchema: quickbooksSandboxCreateRefundReceiptOutputSchema,
	displayName: 'Create Refund Receipt',
	description: 'Creates a refund receipt.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a refund receipt, money paid back to a customer immediately (use Create Credit Memo for a credit against future invoices instead). Needs at least one line and the account the refund is paid from (from List Accounts); the customer id comes from List Customers. Not idempotent: each call records a new refund.',
		idempotent: false,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer ID',
			description: 'Optional QuickBooks customer id of the person refunded. Use List Customers to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "SalesItemLineDetail", "Amount": 50, "Description": "Consulting", "SalesItemLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}}]. Amount must equal Qty x UnitPrice.',
		}),
		depositToAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Deposit To Account ID',
			description: 'Bank or credit card account the refund is paid out of. Use List Accounts to find it.',
		}),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'QuickBooks payment method id (cash, check, credit card). Use List Payment Methods to find it.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the refund receipt, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'Reference number shown on the refund receipt. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'Email address the refund receipt is sent to with Send Refund Receipt.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'Message to the customer, shown on the refund receipt.',
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
		const { customerId, lines, depositToAccountId, paymentMethodId, txnDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'RefundReceipt',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
						PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
						TxnDate: txnDate,
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
