import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateSalesReceiptOutputSchema } from '../../../output-schemas';

export const updateSalesReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_sales_receipt',
	outputSchema: quickbooksSandboxUpdateSalesReceiptOutputSchema,
	displayName: 'Update Sales Receipt',
	description: 'Changes fields of an existing sales receipt.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one sales receipt (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Sales Receipt) with your changes. Get the id from List Sales Receipts.',
		idempotent: true,
	},
	props: {
		salesReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Sales Receipt ID',
			description: 'QuickBooks sales receipt id. Use List Sales Receipts to find it.',
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
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'New payment method id. Use List Payment Methods to find it.',
		}),
		depositToAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Deposit To Account ID',
			description: 'New account id. Use List Accounts to find it.',
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
		const { salesReceiptId, customerId, lines, txnDate, paymentMethodId, depositToAccountId, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'SalesReceipt',
			id: salesReceiptId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							CustomerRef: quickbooksUtils.ref({ value: customerId }),
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							TxnDate: txnDate,
							PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
							DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
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
