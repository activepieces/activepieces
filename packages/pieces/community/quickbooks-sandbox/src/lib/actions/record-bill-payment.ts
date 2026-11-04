import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksBillPayment, QuickbooksFault } from '../common/types';
import { recordBillPaymentOutputSchema } from '../output-schemas';

export const recordBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'record_bill_payment',
	outputSchema: recordBillPaymentOutputSchema,
	displayName: 'Record Bill Payment (AP)',
	description: 'Pays one or more vendor bills in QuickBooks, in full or in part, by check or credit card.',
	audience: 'human',
	aiMetadata: {
		description: 'Record a payment made to a vendor to settle one or more outstanding bills, by check or credit card. Each bill line takes the amount applied so partial payments and paying several bills in a single payment are both supported. Not idempotent: each call creates a new bill payment, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		vendorRef: quickbooksProps.billPaymentVendorRef({ required: true }),
		payType: Property.StaticDropdown({
			displayName: 'Pay With',
			required: true,
			options: {
				options: [
					{ label: 'Check', value: 'Check' },
					{ label: 'Credit Card', value: 'CreditCard' },
				],
			},
			defaultValue: 'Check',
		}),
		payFromAccountRef: quickbooksProps.payFromAccountRef({ required: true }),
		billLines: Property.Array({
			displayName: 'Bills To Pay',
			description: 'One or more bills this payment applies to. Amounts can be less than the bill balance for a partial payment.',
			required: true,
			properties: {
				billId: Property.ShortText({
					displayName: 'Bill ID',
					description: 'The transaction Id of the bill being paid. Use the bill Id returned by Create Bill or a QuickBooks report.',
					required: true,
				}),
				amount: Property.Number({
					displayName: 'Amount To Apply',
					required: true,
				}),
			},
		}),
		txnDate: Property.DateTime({
			displayName: 'Payment Date',
			description: 'Defaults to today if empty.',
			required: false,
		}),
		docNumber: Property.ShortText({
			displayName: 'Reference / Check Number',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Memo (Private Note)',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const billLines = props['billLines'] as { billId: string; amount: number }[];
		if (billLines.length === 0) {
			throw new Error('At least one bill is required.');
		}

		const lines = billLines.map((line) => ({
			Amount: line.amount,
			LinkedTxn: [{ TxnId: line.billId, TxnType: 'Bill' as const }],
		}));

		const totalAmt = lines.reduce((sum, line) => sum + line.Amount, 0);

		const payType = props['payType'];
		const payFromAccountRef = { value: props['payFromAccountRef'] };

		const billPaymentPayload = {
			VendorRef: { value: props['vendorRef'] },
			PayType: payType,
			TotalAmt: totalAmt,
			Line: lines,
			...(payType === 'Check' && { CheckPayment: { BankAccountRef: payFromAccountRef } }),
			...(payType === 'CreditCard' && { CreditCardPayment: { CCAccountRef: payFromAccountRef } }),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['docNumber'] && { DocNumber: props['docNumber'] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const response = await quickbooksClient.request<{
			BillPayment: QuickbooksBillPayment;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/billpayment',
			body: billPaymentPayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error recording bill payment: ${response.Fault.Error.map(
					(e) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.BillPayment;
	},
});
