import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateBillPaymentOutputSchema } from '../../../output-schemas';

export const updateBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_bill_payment',
	outputSchema: quickbooksSandboxUpdateBillPaymentOutputSchema,
	displayName: 'Update Bill Payment',
	description: 'Changes fields of an existing bill payment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one bill payment (a sparse update); the latest SyncToken is read first. Setting Lines replaces every applied bill, so pass the full list (from Get Bill Payment) and keep Total Amount equal to their sum. Get the id from List Bill Payments; to cancel a payment use Void Bill Payment.',
		idempotent: true,
	},
	props: {
		billPaymentId: quickbooksAiProps.id({
			required: true,
			displayName: 'Bill Payment ID',
			description: 'QuickBooks bill payment id. Use List Bill Payments to find it.',
		}),
		vendorId: quickbooksAiProps.id({
			required: false,
			displayName: 'Vendor ID',
			description: 'New vendor id. Use List Vendors to find it.',
		}),
		payType: Property.StaticDropdown({
			displayName: 'Pay Type',
			description: 'Check or CreditCard. Required when Payment Account ID is set.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Check', value: 'Check' },
					{ label: 'Credit Card', value: 'CreditCard' },
				],
			},
		}),
		paymentAccountId: quickbooksAiProps.id({
			required: false,
			displayName: 'Payment Account ID',
			description: 'New bank account id for Check, or credit card account id for CreditCard. Use List Accounts to find it.',
		}),
		totalAmt: Property.Number({ displayName: 'Total Amount', description: 'New total amount paid.', required: false }),
		lines: quickbooksAiProps.lines({
			required: false,
			description:
				'JSON array that replaces every applied bill, e.g. [{"Amount": 200, "LinkedTxn": [{"TxnId": "145", "TxnType": "Bill"}]}].',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'New date, YYYY-MM-DD.',
		}),
		docNumber: Property.ShortText({ displayName: 'Reference Number', description: 'New reference number.', required: false }),
		privateNote: Property.LongText({ displayName: 'Private Note', description: 'New internal memo.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			billPaymentId,
			vendorId,
			payType,
			paymentAccountId,
			totalAmt,
			lines,
			txnDate,
			docNumber,
			privateNote,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'BillPayment',
			id: billPaymentId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							VendorRef: quickbooksUtils.ref({ value: vendorId }),
							PayType: payType,
							...paymentAccount({ payType, paymentAccountId }),
							TotalAmt: totalAmt,
							Line: quickbooksUtils.linesArray({ lines, propName: 'Lines' }),
							TxnDate: txnDate,
							DocNumber: docNumber,
							PrivateNote: privateNote,
						},
					}),
				},
			}),
		});
	},
});

function paymentAccount({
	payType,
	paymentAccountId,
}: {
	payType: string | undefined;
	paymentAccountId: string | undefined;
}): Record<string, unknown> {
	if (paymentAccountId === undefined || paymentAccountId === '') {
		return {};
	}
	if (payType === 'Check') {
		return { CheckPayment: { BankAccountRef: { value: paymentAccountId } } };
	}
	if (payType === 'CreditCard') {
		return { CreditCardPayment: { CCAccountRef: { value: paymentAccountId } } };
	}
	throw new Error('Set Pay Type to Check or CreditCard together with Payment Account ID.');
}
