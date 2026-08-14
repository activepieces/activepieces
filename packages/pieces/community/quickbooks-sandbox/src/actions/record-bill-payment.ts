import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksApiCall, quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksAccount, QuickbooksBillPayment, QuickbooksVendor } from '../lib/types';

export const recordBillPaymentAction = createAction({
	auth: quickbooksAuth,
	name: 'record_bill_payment',
	displayName: 'Record Bill Payment (AP)',
	description: 'Pays one or more vendor bills in QuickBooks, in full or in part, by check or credit card.',
	audience: 'both',
	aiMetadata: {
		description: 'Record a payment made to a vendor to settle one or more outstanding bills, by check or credit card. Each bill line takes the amount applied so partial payments and paying several bills in a single payment are both supported. Not idempotent: each call creates a new bill payment, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		vendorRef: Property.Dropdown({
			auth: quickbooksAuth,
			displayName: 'Vendor',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, placeholder: 'Connect your account first', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;
				const companyId = props?.['companyId'];
				const query = `SELECT Id, DisplayName FROM Vendor STARTPOSITION 1 MAXRESULTS 1000`;
				// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/vendor#query-a-vendor
				const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksVendor>>({
					accessToken: access_token,
					companyId,
					query,
				});

				if (response.Fault) {
					return { disabled: true, placeholder: 'Unable to load vendors', options: [] };
				}

				const vendors = response.QueryResponse?.['Vendor'] ?? [];
				return {
					disabled: false,
					options: vendors.map((vendor) => ({
						label: vendor.DisplayName,
						value: vendor.Id,
					})),
				};
			},
		}),
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
		payFromAccountRef: Property.Dropdown({
			auth: quickbooksAuth,
			displayName: 'Pay From Account',
			description: 'The checking/savings account (for Check) or credit card account (for Credit Card) the payment is made from.',
			required: true,
			refreshers: ['payType'],
			options: async ({ auth, payType }) => {
				if (!auth || !payType) {
					return { disabled: true, placeholder: 'Select a pay-with method first', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;
				const companyId = props?.['companyId'];
				const accountType = payType === 'CreditCard' ? 'Credit Card' : 'Bank';
				const query = `SELECT Id, Name, AccountType FROM Account WHERE AccountType = '${accountType}' AND Active = true MAXRESULTS 1000`;
				// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account#query-an-account
				const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksAccount>>({
					accessToken: access_token,
					companyId,
					query,
				});

				if (response.Fault) {
					return { disabled: true, placeholder: 'Unable to load accounts', options: [] };
				}

				const accounts = response.QueryResponse?.['Account'] ?? [];
				return {
					disabled: false,
					options: accounts.map((account) => ({
						label: account.Name,
						value: account.Id,
					})),
				};
			},
		}),
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
		const { access_token } = context.auth;
		const companyId = context.auth.props?.['companyId'] as string;

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

		const payType = props['payType'] as 'Check' | 'CreditCard';
		const payFromAccountRef = { value: props['payFromAccountRef'] };

		const billPaymentPayload: Partial<QuickbooksBillPayment> = {
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

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/billpayment#create-a-billpayment
		const response = await quickbooksApiCall<{
			BillPayment: QuickbooksBillPayment;
			time: string;
			Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
		}>({
			accessToken: access_token,
			companyId,
			method: HttpMethod.POST,
			resourceUri: '/billpayment',
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
