import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateVendorCreditOutputSchema } from '../../../output-schemas';

export const updateVendorCreditAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_vendor_credit',
	outputSchema: quickbooksSandboxUpdateVendorCreditOutputSchema,
	displayName: 'Update Vendor Credit',
	description: 'Changes fields of an existing vendor credit.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one vendor credit (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Vendor Credit) with your changes. Get the id from List Vendor Credits.',
		idempotent: true,
	},
	props: {
		vendorCreditId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor Credit ID',
			description: 'QuickBooks vendor credit id. Use List Vendor Credits to find it.',
		}),
		vendorId: quickbooksAiProps.id({
			required: false,
			displayName: 'Vendor ID',
			description: 'New vendor id. Use List Vendors to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks line format, e.g. [{"DetailType": "AccountBasedExpenseLineDetail", "Amount": 50, "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'Reference Number', description: 'New reference number.', required: false }),
		apAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'AP Account ID',
			description: 'New accounts payable account id. Use List Accounts to find it.',
		}),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { vendorCreditId, vendorId, lines, txnDate, docNumber, apAccountId, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'VendorCredit',
			id: vendorCreditId,
			requiredFields: ['VendorRef'],
			fields: quickbooksUtils.requireChanges({
				fields: {
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
			}),
		});
	},
});
