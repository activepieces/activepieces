import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateBillOutputSchema } from '../../../output-schemas';

export const createBillAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_bill',
	outputSchema: quickbooksSandboxCreateBillOutputSchema,
	displayName: 'Create Bill',
	description: 'Creates a bill from a vendor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a bill, an amount owed to a vendor (accounts payable). Needs the vendor id (from List Vendors) and at least one line; expense account ids come from List Accounts and item ids from List Items. Pay it with Create Bill Payment. Not idempotent: each call creates a new bill.',
		idempotent: false,
	},
	props: {
		vendorId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor ID',
			description: 'QuickBooks vendor id. Use List Vendors to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 200, "Description": "Office rent", "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}}]. For items use "ItemBasedExpenseLineDetail": {"ItemRef": {"value": "1"}, "Qty": 2, "UnitPrice": 100}.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the bill, YYYY-MM-DD. Defaults to today.',
		}),
		dueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Due Date',
			description: 'Date the bill is due, YYYY-MM-DD. Defaults from the terms or the transaction date.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Bill Number',
			description: 'The vendor\'s reference number for the bill.',
			required: false,
		}),
		salesTermId: quickbooksAiProps.id({
			required: false,
			displayName: 'Term ID',
			description: 'Payment terms id. Use List Terms to find it.',
		}),
		apAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'AP Account ID',
			description: 'Accounts payable account id, when the company has more than one. Use List Accounts to find it.',
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal memo, not shown to the vendor.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { vendorId, lines, txnDate, dueDate, docNumber, salesTermId, apAccountId, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Bill',
			body: {
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
		});
	},
});
