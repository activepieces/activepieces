import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateEstimateOutputSchema } from '../../../output-schemas';

export const createEstimateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_estimate',
	outputSchema: quickbooksSandboxCreateEstimateOutputSchema,
	displayName: 'Create Estimate',
	description: 'Creates a estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an estimate (quote) for a customer, which can later be turned into an invoice. Needs the customer id (from List Customers) and at least one line; item ids come from List Items. Not idempotent: each call creates a new estimate.',
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
			description: 'Date of the estimate, YYYY-MM-DD. Defaults to today.',
		}),
		expirationDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Expiration Date',
			description: 'Date the estimate expires, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Document Number',
			description: 'Reference number shown on the estimate. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		billEmail: Property.ShortText({
			displayName: 'Billing Email',
			description: 'Email address the estimate is sent to with Send Estimate.',
			required: false,
		}),
		customerMemo: Property.LongText({
			displayName: 'Customer Memo',
			description: 'Message to the customer, shown on the estimate.',
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
		const { customerId, lines, txnDate, expirationDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Estimate',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						CustomerRef: quickbooksUtils.ref({ value: customerId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						ExpirationDate: expirationDate,
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
