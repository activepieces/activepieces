import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateCreditMemoOutputSchema } from '../../../output-schemas';

export const updateCreditMemoAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_credit_memo',
	outputSchema: quickbooksSandboxUpdateCreditMemoOutputSchema,
	displayName: 'Update Credit Memo',
	description: 'Changes fields of an existing credit memo.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one credit memo (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Credit Memo) with your changes. Get the id from List Credit Memos.',
		idempotent: true,
	},
	props: {
		creditMemoId: quickbooksAiProps.id({
			required: true,
			displayName: 'Credit Memo ID',
			description: 'QuickBooks credit memo id. Use List Credit Memos to find it.',
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
		docNumber: Property.ShortText({ displayName: 'Document Number', description: 'New reference number.', required: false }),
		billEmail: Property.ShortText({ displayName: 'Billing Email', description: 'New billing email address.', required: false }),
		customerMemo: Property.LongText({ displayName: 'Customer Memo', description: 'New message to the customer.', required: false }),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal note.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { creditMemoId, customerId, lines, txnDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'CreditMemo',
			id: creditMemoId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
