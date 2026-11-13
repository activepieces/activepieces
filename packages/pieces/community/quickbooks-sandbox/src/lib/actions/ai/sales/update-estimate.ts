import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateEstimateOutputSchema } from '../../../output-schemas';

export const updateEstimateAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_estimate',
	outputSchema: quickbooksSandboxUpdateEstimateOutputSchema,
	displayName: 'Update Estimate',
	description: 'Changes fields of an existing estimate.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one estimate (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Estimate) with your changes. Set TxnStatus (Pending, Accepted, Closed, Rejected) through Additional Fields. Get the id from List Estimates.',
		idempotent: true,
	},
	props: {
		estimateId: quickbooksAiProps.id({
			required: true,
			displayName: 'Estimate ID',
			description: 'QuickBooks estimate id. Use List Estimates to find it.',
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
		expirationDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Expiration Date',
			description: 'New expiration date, YYYY-MM-DD.',
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
		const { estimateId, customerId, lines, txnDate, expirationDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Estimate',
			id: estimateId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
