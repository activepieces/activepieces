import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxSendPurchaseOrderOutputSchema } from '../../../output-schemas';

export const updatePurchaseOrderAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_purchase_order',
	outputSchema: quickbooksSandboxSendPurchaseOrderOutputSchema,
	displayName: 'Update Purchase Order',
	description: 'Changes fields of an existing purchase order.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one purchase order (a sparse update), including closing it with Status; the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Purchase Order) with your changes. Get the id from List Purchase Orders.',
		idempotent: true,
	},
	props: {
		purchaseOrderId: quickbooksAiProps.id({
			required: true,
			displayName: 'Purchase Order ID',
			description: 'QuickBooks purchase order id. Use List Purchase Orders to find it.',
		}),
		vendorId: quickbooksAiProps.id({
			required: false,
			displayName: 'Vendor ID',
			description: 'New vendor id. Use List Vendors to find it.',
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every line, in QuickBooks line format, e.g. [{"DetailType": "ItemBasedExpenseLineDetail", "Amount": 100, "ItemBasedExpenseLineDetail": {"ItemRef": {"value": "1"}, "Qty": 10, "UnitPrice": 10}}].',
		}),
		poStatus: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Open or Closed.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'Open' },
					{ label: 'Closed', value: 'Closed' },
				],
			},
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		dueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Due Date',
			description: 'New expected date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'PO Number', description: 'New reference number.', required: false }),
		poEmail: Property.ShortText({ displayName: 'Vendor Email', description: 'New vendor email address.', required: false }),
		apAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'AP Account ID',
			description: 'New accounts payable account id. Use List Accounts to find it.',
		}),
		memo: Property.LongText({ displayName: 'Vendor Message', description: 'New message to the vendor.', required: false }),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			purchaseOrderId,
			vendorId,
			lines,
			poStatus,
			txnDate,
			dueDate,
			docNumber,
			poEmail,
			apAccountId,
			memo,
			privateNote,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'PurchaseOrder',
			id: purchaseOrderId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							VendorRef: quickbooksUtils.ref({ value: vendorId }),
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							POStatus: poStatus,
							TxnDate: txnDate,
							DueDate: dueDate,
							DocNumber: docNumber,
							POEmail: poEmail ? { Address: poEmail } : undefined,
							APAccountRef: quickbooksUtils.ref({ value: apAccountId }),
							Memo: memo,
							PrivateNote: privateNote,
						},
					}),
				},
			}),
		});
	},
});
