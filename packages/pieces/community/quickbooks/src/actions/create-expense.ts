import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../index';
import { quickbooksCommon, QuickbooksEntityResponse } from '../lib/common';
import {
	QuickbooksAccount,
	QuickbooksVendor,
	QuickbooksPurchase,
	QuickbooksRef,
} from '../lib/types';

export const createExpenseAction = createAction({
	auth: quickbooksAuth,
	name: 'create_expense',
	displayName: 'Create Expense',
	description: 'Creates an expense transaction (purchase) in QuickBooks.',
	props: {
		accountRef: Property.Dropdown({
			displayName: 'Bank/Credit Card Account',
			description: 'The account from which the expense was paid.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, placeholder: 'Connect account', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;

				const companyId = props?.['companyId'];

				const apiUrl = quickbooksCommon.getApiUrl(companyId);
				const query = `SELECT Id, Name, AccountType FROM Account STARTPOSITION 1 MAXRESULTS 1000`;
				const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksAccount>>({
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
						`QuickBooks API Error fetching accounts: ${response.body.Fault.Error.map(
							(e: { Message: string }) => e.Message,
						).join(', ')}`,
					);
				}

				const accounts = response.body.QueryResponse?.['Account'] ?? [];
				return {
					disabled: false,
					options: accounts.map((account) => ({
						label: `${account.Name} (${account.AccountType})`,
						value: account.Id,
					})),
				};
			},
		}),
		paymentType: Property.StaticDropdown({
			displayName: 'Payment Type',
			required: true,
			options: {
				options: [
					{ label: 'Cash', value: 'Cash' },
					{ label: 'Check', value: 'Check' },
					{ label: 'Credit Card', value: 'CreditCard' },
				],
			},
			defaultValue: 'Cash',
		}),
		entityRef: Property.Dropdown({
			displayName: 'Payee (Vendor)',
			description: 'Optional - The vendor the expense was paid to.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, placeholder: 'Connect account', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;

				const companyId = props?.['companyId'];
				const apiUrl = quickbooksCommon.getApiUrl(companyId);
				const query = `SELECT Id, DisplayName FROM Vendor STARTPOSITION 1 MAXRESULTS 1000`;
				const response = await httpClient.sendRequest<QuickbooksEntityResponse<QuickbooksVendor>>({
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
						`QuickBooks API Error fetching vendors: ${response.body.Fault.Error.map(
							(e: { Message: string }) => e.Message,
						).join(', ')}`,
					);
				}

				const vendors = response.body.QueryResponse?.['Vendor'] ?? [];
				return {
					disabled: false,
					options: vendors.map((vendor) => ({
						label: vendor.DisplayName,
						value: vendor.Id,
					})),
				};
			},
		}),
		txnDate: Property.DateTime({
			displayName: 'Payment Date',
			description: 'The date the expense occurred.',
			required: false, // Defaults to today if empty
		}),
		// Line items for the expense details
		lineItems: Property.Array({
			displayName: 'Line Items',
			description:
				'Details of the expense (e.g., categories or items purchased). At least one line is required.',
			required: true,
			properties: {
				amount: Property.Number({
					displayName: 'Amount',
					required: true,
				}),
				description: Property.ShortText({
					displayName: 'Description',
					required: false,
				}),
				detailType: Property.StaticDropdown({
					displayName: 'Detail Type',
					required: true,
					options: {
						options: [
							{
								label: 'Account Based Expense Line Detail',
								value: 'AccountBasedExpenseLineDetail',
							},
						],
					},
					defaultValue: 'AccountBasedExpenseLineDetail',
				}),
				expenseAccountId: Property.ShortText({
					displayName: 'Expense Category/Account ID',
					description:
						'Enter the ID of the Expense Account. Required for AccountBasedExpenseLineDetail.',
					required: true,
				}),
			},
		}),
		privateNote: Property.LongText({
			displayName: 'Memo (Private Note)',
			description: 'Internal note about the expense.',
			required: false,
		}),
	},

	async run(context) {
		const { access_token } = context.auth;
		const companyId = context.auth.props?.['companyId'];

		const apiUrl = quickbooksCommon.getApiUrl(companyId);
		const props = context.propsValue;

		const lines = (props['lineItems'] as any[]).map((line) => {
			const detail: any = {
				Amount: line['amount'],
				Description: line['description'],
				DetailType: line['detailType'],
			};
			if (line['detailType'] === 'AccountBasedExpenseLineDetail') {
				if (!line['expenseAccountId']) {
					throw new Error(
						'Expense Category/Account ID is required for Account Based Expense Line Detail.',
					);
				}
				detail.AccountBasedExpenseLineDetail = {
					AccountRef: { value: line['expenseAccountId'] },
				};
			}
			return detail;
		});

		if (lines.length === 0) {
			throw new Error('At least one line item is required.');
		}

		const expensePayload: Partial<QuickbooksPurchase> = {
			AccountRef: { value: props['accountRef'] },
			PaymentType: props['paymentType'] as 'Cash' | 'Check' | 'CreditCard',
			Line: lines,
			...(props['entityRef'] && { EntityRef: { value: props['entityRef'] } as QuickbooksRef }),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const endpoint = 'purchase';

		const response = await httpClient.sendRequest<{
			Purchase: QuickbooksPurchase;
			time: string;
			Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
		}>({
			method: HttpMethod.POST,
			url: `${apiUrl}/${endpoint}`,
			queryParams: { minorversion: '70' },
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: expensePayload,
		});

		if (response.body.Fault) {
			throw new Error(
				`QuickBooks API Error creating expense: ${response.body.Fault.Error.map(
					(e: any) => e.Message,
				).join(', ')} - Detail: ${response.body.Fault.Error.map((e: any) => e.Detail).join(', ')}`,
			);
		}

		return response.body.Purchase;
	},
});
