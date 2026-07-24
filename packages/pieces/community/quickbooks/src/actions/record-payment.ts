import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksCustomer, QuickbooksPayment, QuickbooksRef } from '../lib/types';

export const recordPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'record_payment',
	displayName: 'Record Payment',
	description: 'Records a customer payment in QuickBooks, optionally applying it to invoices.',
	audience: 'both',
	aiMetadata: {
		description: 'Record a payment received from a customer for a given total amount. Optionally apply the payment to one or more specific invoices by their transaction Id, set the deposit-to account, payment date, and reference number. If no invoices are specified, QuickBooks leaves the amount unapplied. Not idempotent: each call creates a new payment, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		customerRef: Property.Dropdown({
			auth: quickbooksAuth,
			displayName: 'Customer',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				const { access_token, props } = auth as OAuth2PropertyValue;
				const companyId = props?.['companyId'];
				const apiUrl = quickbooksCommon.getApiUrl(companyId);
				const query = `SELECT Id, DisplayName FROM Customer STARTPOSITION 1 MAXRESULTS 1000`;
				const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksCustomer>>({
					method: HttpMethod.GET,
					url: `${apiUrl}/query`,
					queryParams: { query: query, minorversion: '70' },
					headers: {
						Authorization: `Bearer ${access_token}`,
						Accept: 'application/json',
					},
				});

				if (response.body.Fault) {
					throw new Error(
						`QuickBooks API Error: ${response.body.Fault.Error.map(
							(e: { Message: string }) => e.Message,
						).join(', ')}`,
					);
				}

				const customers = response.body.QueryResponse?.['Customer'] ?? [];
				return {
					disabled: false,
					options: customers.map((customer) => ({
						label: customer.DisplayName,
						value: customer.Id,
					})),
				};
			},
		}),
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
		const { access_token } = context.auth;
		const companyId = context.auth.props?.['companyId'];

		const apiUrl = quickbooksCommon.getApiUrl(companyId as string);
		const props = context.propsValue;

		const lines = ((props['lineItems'] as any[]) ?? []).map((line) => ({
			Amount: line['amount'],
			LinkedTxn: [{ TxnId: line['invoiceId'], TxnType: 'Invoice' }],
		}));

		const paymentPayload: Partial<QuickbooksPayment> = {
			CustomerRef: { value: props['customerRef'] } as QuickbooksRef,
			TotalAmt: props['totalAmount'],
			...(lines.length > 0 && { Line: lines }),
			...(props['depositToAccountId'] && {
				DepositToAccountRef: { value: props['depositToAccountId'] } as QuickbooksRef,
			}),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['paymentRefNum'] && { PaymentRefNum: props['paymentRefNum'] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const response = await httpClient.sendRequest<{
			Payment: QuickbooksPayment;
			time: string;
			Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
		}>({
			method: HttpMethod.POST,
			url: `${apiUrl}/payment`,
			queryParams: { minorversion: '70' },
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: paymentPayload,
		});

		if (response.body.Fault) {
			throw new Error(
				`QuickBooks API Error recording payment: ${response.body.Fault.Error.map(
					(e: any) => e.Message,
				).join(', ')} - Detail: ${response.body.Fault.Error.map((e: any) => e.Detail).join(', ')}`,
			);
		}

		return response.body.Payment;
	},
});
