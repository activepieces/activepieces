import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateInvoiceOutputSchema } from '../../../output-schemas';

export const createInvoiceAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_invoice',
	outputSchema: quickbooksSandboxCreateInvoiceOutputSchema,
	displayName: 'Create Invoice',
	description: 'Creates a invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an invoice for a customer, which they owe until a payment from Create Payment is applied to it. Needs the customer id (from List Customers) and at least one line; item ids come from List Items. Not idempotent: each call creates a new invoice.',
		idempotent: false,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: true,
			displayName: 'Customer ID',
			description: 'QuickBooks customer id. Use List Customers to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "SalesItemLineDetail", "Amount": 50, "Description": "Consulting", "SalesItemLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}}]. Amount must equal Qty x UnitPrice.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the invoice, YYYY-MM-DD. Defaults to today.',
		}),
		dueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Due Date',
			description: 'Date payment is due, YYYY-MM-DD. Defaults from the customer\'s payment terms.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'Reference number shown on the invoice. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'Email address the invoice is sent to with Send Invoice.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'Message to the customer, shown on the invoice.',
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
		const { customerId, lines, txnDate, dueDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Invoice',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						DueDate: dueDate,
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
