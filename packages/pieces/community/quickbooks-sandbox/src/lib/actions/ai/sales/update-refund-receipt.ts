import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateRefundReceiptOutputSchema } from '../../../output-schemas';

export const updateRefundReceiptAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_refund_receipt',
	outputSchema: quickbooksSandboxUpdateRefundReceiptOutputSchema,
	displayName: 'Update Refund Receipt',
	description: 'Changes fields of an existing refund receipt.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one refund receipt (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Refund Receipt) with your changes. Get the id from List Refund Receipts.',
		idempotent: true,
	},
	props: {
		refundReceiptId: quickbooksAiProps.id({
			required: true,
			displayName: 'Refund Receipt ID',
			description: 'QuickBooks refund receipt id. Use List Refund Receipts to find it.',
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
		depositToAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Deposit To Account ID',
			description: 'New account id. Use List Accounts to find it.',
		}),
		paymentMethodId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Method ID',
			description: 'New payment method id. Use List Payment Methods to find it.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
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
		const { refundReceiptId, customerId, lines, depositToAccountId, paymentMethodId, txnDate, docNumber, billEmail, customerMemo, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'RefundReceipt',
			id: refundReceiptId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							CustomerRef: quickbooksUtils.ref({ value: customerId }),
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
							PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
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
