import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreatePurchaseOrderOutputSchema } from '../../../output-schemas';

export const createPurchaseOrderAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_purchase_order',
	outputSchema: quickbooksSandboxCreatePurchaseOrderOutputSchema,
	displayName: 'Create Purchase Order',
	description: 'Creates a purchase order for a vendor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a purchase order, an order to a vendor that does not affect the books until it becomes a bill. Needs the vendor id (from List Vendors) and at least one line; item ids come from List Items and account ids from List Accounts. Email it with Send Purchase Order. Not idempotent: each call creates a new purchase order.',
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
				'JSON array of QuickBooks line objects, e.g. [{"DetailType": "ItemBasedExpenseLineDetail", "Amount": 100, "Description": "Widgets", "ItemBasedExpenseLineDetail": {"ItemRef": {"value": "1"}, "Qty": 10, "UnitPrice": 10}}]. Amount must equal Qty x UnitPrice. For an account line use "AccountBasedExpenseLineDetail": {"AccountRef": {"value": "7"}}.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the purchase order, YYYY-MM-DD. Defaults to today.',
		}),
		dueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Due Date',
			description: 'Date the order is expected, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({
			displayName: 'PO Number',
			description: 'Reference number shown on the purchase order. QuickBooks assigns one when empty and custom numbering is off.',
			required: false,
		}),
		poEmail: Property.ShortText({
			displayName: 'Vendor Email',
			description: 'Email address the purchase order is sent to with Send Purchase Order.',
			required: false,
		}),
		apAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'AP Account ID',
			description: 'Accounts payable account id, when the company has more than one. Use List Accounts to find it.',
		}),
		memo: Property.LongText({
			displayName: 'Vendor Message',
			description: 'Message to the vendor, shown on the purchase order.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'Internal memo, not shown to the vendor.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { vendorId, lines, txnDate, dueDate, docNumber, poEmail, apAccountId, memo, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'PurchaseOrder',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						VendorRef: quickbooksUtils.ref({ value: vendorId }),
						Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
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
		});
	},
});
