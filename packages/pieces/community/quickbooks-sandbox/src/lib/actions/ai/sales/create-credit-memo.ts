import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateCreditMemoOutputSchema } from '../../../output-schemas';

export const createCreditMemoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_credit_memo',
	outputSchema: quickbooksSandboxCreateCreditMemoOutputSchema,
	displayName: 'Create Credit Memo',
	description: 'Creates a credit memo for a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a credit memo, a credit a customer can apply to open or future invoices. Needs the customer id (from List Customers) and at least one line; item ids come from List Items. Not idempotent: each call creates a new credit memo.',
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
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "SalesItemLineDetail", "Amount": 50, "Description": "Refund", "SalesItemLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}}]. Amount must equal Qty x UnitPrice.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the credit memo, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'Reference number shown on the credit memo. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'Email address the credit memo is sent to with Send Credit Memo.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'Message to the customer, shown on the credit memo.',
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
		const { customerId, lines, txnDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'CreditMemo',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
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
