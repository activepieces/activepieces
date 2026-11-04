import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateInvoiceOutputSchema } from '../../../output-schemas';

export const updateInvoiceAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_invoice',
	outputSchema: quickbooksSandboxUpdateInvoiceOutputSchema,
	displayName: 'Update Invoice',
	description: 'Changes fields of an existing invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one invoice (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Invoice) with your changes. Get the id from List Invoices.',
		idempotent: true,
	},
	props: {
		invoiceId: quickbooksAiProps.id({
			required: true,
			displayName: 'Invoice ID',
			description: 'QuickBooks invoice id. Use List Invoices to find it.',
		}),
		customerId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer id. Use List Customers to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks line format, e.g. [{"DetailType": "SalesItemLineDetail", "Amount": 50, "SalesItemLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		dueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Due Date',
			description: 'New due date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'New reference number.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'New billing email address.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'New message to the customer.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'New internal note.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { invoiceId, customerId, lines, txnDate, dueDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Invoice',
			id: invoiceId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
