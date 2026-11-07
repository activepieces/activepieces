import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxSendPaymentOutputSchema } from '../../../output-schemas';

export const updatePaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_payment',
	outputSchema: quickbooksSandboxSendPaymentOutputSchema,
	displayName: 'Update Payment',
	description: 'Changes fields of an existing payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one payment (a sparse update); the latest SyncToken is read first. Setting Lines replaces all existing lines, so pass the full list (from Get Payment) with your changes. Get the id from List Payments.',
		idempotent: true,
	},
	props: {
		paymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment ID',
			description: 'QuickBooks payment id. Use List Payments to find it.',
		}),
		customerId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer ID',
			description: 'New customer id. Use List Customers to find it.',
		}),
		totalAmount: Property.Number({
			displayName: 'Total Amount',
			description: 'New total amount received.',
			required: false,
		}),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every applied line, e.g. [{"Amount": 100, "LinkedTxn": [{"TxnId": "130", "TxnType": "Invoice"}]}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		paymentRefNum: Property.ShortText({
			displayName: 'Payment Reference Number',
			description: 'New check number or reference.',
			required: false,
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
		privateNote: Property.LongText({
			displayName: 'Private Note',
			description: 'New internal note.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const { paymentId, customerId, totalAmount, lines, txnDate, paymentRefNum, paymentMethodId, depositToAccountId, privateNote, additionalFields } = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Payment',
			id: paymentId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							CustomerRef: quickbooksUtils.ref({ value: customerId }),
							TotalAmt: totalAmount,
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							TxnDate: txnDate,
							PaymentRefNum: paymentRefNum,
							PaymentMethodRef: quickbooksUtils.ref({ value: paymentMethodId }),
							DepositToAccountRef: quickbooksUtils.ref({ value: depositToAccountId }),
							PrivateNote: privateNote,
						},
					}),
				},
			}),
		});
	},
});
