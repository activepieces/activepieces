import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateBillOutputSchema } from '../../../output-schemas';

export const updateBillAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_bill',
	outputSchema: quickbooksSandboxUpdateBillOutputSchema,
	displayName: 'Update Bill',
	description: 'Changes fields of an existing bill.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one bill (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Bill) with your changes. Get the id from List Bills.',
		idempotent: true,
	},
	props: {
		billId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill ID',
			description: 'QuickBooks bill id. Use List Bills to find it.',
		}),
		vendorId: quickbooksAiProps.id({
			required: false,
			displayName: 'Vendor ID',
			description: 'New vendor id. Use List Vendors to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks line format, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 200, "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}}].',
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
		docNumber: Property.ShortText({ displayName: 'Bill Number', description: 'New vendor reference number.', required: false }),
		salesTermId: quickbooksAiProps.id({
			required: false,
			displayName: 'Term ID',
			description: 'New payment terms id. Use List Terms to find it.',
		}),
		apAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'AP Account ID',
			description: 'New accounts payable account id. Use List Accounts to find it.',
		}),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { billId, vendorId, lines, txnDate, dueDate, docNumber, salesTermId, apAccountId, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Bill',
			id: billId,
			requiredFields: ['VendorRef'],
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							VendorRef: quickbooksUtils.ref({ value: vendorId }),
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							TxnDate: txnDate,
							DueDate: dueDate,
							DocNumber: docNumber,
							SalesTermRef: quickbooksUtils.ref({ value: salesTermId }),
							APAccountRef: quickbooksUtils.ref({ value: apAccountId }),
							PrivateNote: privateNote,
						},
					}),
				},
			}),
		});
	},
});
