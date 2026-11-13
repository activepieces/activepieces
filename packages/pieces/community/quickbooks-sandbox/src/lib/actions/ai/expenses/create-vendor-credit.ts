import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateVendorCreditOutputSchema } from '../../../output-schemas';

export const createVendorCreditAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_vendor_credit',
	outputSchema: quickbooksSandboxCreateVendorCreditOutputSchema,
	displayName: 'Create Vendor Credit',
	description: 'Creates a vendor credit.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a vendor credit, a refund or credit a vendor owes you that reduces what you owe on bills. Needs the vendor id (from List Vendors) and at least one line; expense account ids come from List Accounts and item ids from List Items. Not idempotent: each call creates a new vendor credit.',
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
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 50, "Description": "Returned supplies", "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}}]. For items use "ItemBasedExpenseLineDetail": {"ItemRef": {"value": "1"}, "Qty": 1, "UnitPrice": 50}.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the vendor credit, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Reference number for the vendor credit.',
			required: false,
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
		const { vendorId, lines, txnDate, docNumber, apAccountId, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'VendorCredit',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						VendorRef: quickbooksUtils.ref({ value: vendorId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
						TxnDate: txnDate,
						DocNumber: docNumber,
						APAccountRef: quickbooksUtils.ref({ value: apAccountId }),
						PrivateNote: privateNote,
					},
				}),
			},
		});
	},
});
