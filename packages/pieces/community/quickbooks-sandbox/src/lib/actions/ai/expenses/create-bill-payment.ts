import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateBillPaymentOutputSchema } from '../../../output-schemas';

export const createBillPaymentAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_bill_payment',
	outputSchema: quickbooksSandboxCreateBillPaymentOutputSchema,
	displayName: 'Create Bill Payment',
	description: 'Records a payment of one or more vendor bills.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a payment to a vendor by check (from a bank account) or credit card, applied to the bills in Lines. Needs the vendor id (from List Vendors), bill ids (from List Bills) and the paying account id (from List Accounts). Not idempotent: each call records a new payment.',
		idempotent: false,
	},
	props: {
		vendorId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor ID',
			description: 'QuickBooks vendor id. Use List Vendors to find it.',
		}),
		payType: Property.StaticDropdown({
			displayName: 'Pay Type',
			description: 'Check pays from a bank account, CreditCard from a credit card account.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Check', value: 'Check' },
					{ label: 'Credit Card', value: 'CreditCard' },
				],
			},
		}),
		paymentAccountId: quickbooksAiProps.id({
			required: true,
			displayName: 'Payment Account ID',
			description: 'Bank account id for Check, or credit card account id for CreditCard. Use List Accounts to find it.',
		}),
		totalAmt: Property.Number({
			displayName: 'Total Amount',
			description: 'Total amount paid. Must equal the sum of the line amounts.',
			required: true,
		}),
		lines: quickbooksAiProps.lines({
			required: true,
			description:
				'JSON array of the bills being paid, e.g. [{"Amount": 200, "LinkedTxn": [{"TxnId": "145", "TxnType": "Bill"}]}]. A vendor credit can be applied with "TxnType": "VendorCredit".',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Transaction Date',
			description: 'Date of the payment, YYYY-MM-DD. Defaults to today.',
		}),
		docNumber: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Check number or other reference for the payment.',
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
		const { vendorId, payType, paymentAccountId, totalAmt, lines, txnDate, docNumber, privateNote, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'BillPayment',
			body: {
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
		});
	},
});

function paymentAccount({ payType, paymentAccountId }: { payType: string; paymentAccountId: string }): Record<string, unknown> {
	if (payType === 'Check') {
		return { CheckPayment: { BankAccountRef: { value: paymentAccountId } } };
	}
	if (payType === 'CreditCard') {
		return { CreditCardPayment: { CCAccountRef: { value: paymentAccountId } } };
	}
	throw new Error('Pay Type must be Check or CreditCard.');
}
