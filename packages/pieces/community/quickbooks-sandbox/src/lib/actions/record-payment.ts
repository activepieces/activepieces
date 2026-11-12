import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksFault, QuickbooksPayment } from '../common/types';
import { paymentReceivedOutputSchema } from '../output-schemas';

export const recordPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'record_payment',
	outputSchema: paymentReceivedOutputSchema,
	displayName: 'Record Payment',
	description: 'Records a customer payment in QuickBooks, optionally applying it to invoices.',
	audience: 'human',
	aiMetadata: {
		description: 'Record a payment received from a customer for a given total amount. Optionally apply the payment to one or more specific invoices by their transaction Id, set the deposit-to account, payment date, and reference number. If no invoices are specified, QuickBooks leaves the amount unapplied. Not idempotent: each call creates a new payment, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		customerRef: quickbooksProps.customerRef({ required: true }),
		totalAmount: Property.Number({
			displayName: 'Total Amount',
			description: 'The total amount of the payment received.',
			required: true,
		}),
		lineItems: Property.Array({
			displayName: 'Apply to Invoices',
			description:
				'Optional. Apply this payment to specific invoices. Leave empty to keep the amount unapplied.',
			required: false,
			properties: {
				invoiceId: Property.ShortText({
					displayName: 'Invoice ID',
					description: 'The transaction Id of the invoice to apply the payment to.',
					required: true,
				}),
				amount: Property.Number({
					displayName: 'Amount Applied',
					description: 'The amount of this payment to apply to the invoice.',
					required: true,
				}),
			},
		}),
		depositToAccountId: Property.ShortText({
			displayName: 'Deposit To Account ID',
			description:
				'Optional. The account to deposit the payment into. Defaults to Undeposited Funds if empty.',
			required: false,
		}),
		txnDate: Property.DateTime({
			displayName: 'Payment Date',
			description: 'The date the payment was received. Defaults to today if empty.',
			required: false,
		}),
		paymentRefNum: Property.ShortText({
			displayName: 'Reference Number',
			description: 'Optional reference number for the payment (e.g. check number).',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Memo (Private Note)',
			description: 'Internal note about the payment.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const lines = ((props['lineItems'] as { invoiceId: string; amount: number }[] | undefined) ?? []).map((line) => ({
			Amount: line['amount'],
			LinkedTxn: [{ TxnId: line['invoiceId'], TxnType: 'Invoice' }],
		}));

		const paymentPayload = {
			CustomerRef: { value: props['customerRef'] },
			TotalAmt: props['totalAmount'],
			...(lines.length > 0 && { Line: lines }),
			...(props['depositToAccountId'] && {
				DepositToAccountRef: { value: props['depositToAccountId'] },
			}),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['paymentRefNum'] && { PaymentRefNum: props['paymentRefNum'] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const response = await quickbooksClient.request<{
			Payment: QuickbooksPayment;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/payment',
			body: paymentPayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error recording payment: ${response.Fault.Error.map(
					(e) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.Payment;
	},
});
