import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksApiCall, quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksBill, QuickbooksVendor, QuickbooksRef, QuickbooksPreferences } from '../lib/types';

export const createBillAction = createAction({
	auth: quickbooksAuth,
	name: 'create_bill',
	displayName: 'Create Bill',
	description: 'Creates a bill (accounts payable) in QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Record a new bill owed to a vendor, with one or more account-based line items (each needs an amount and an expense account Id, and optionally a Class Id on QuickBooks Plus/Advanced). Optionally set the bill date, due date, bill number, and memo. Not idempotent: each call creates a new bill, so guard against duplicates.',
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
					throw new Error(
						`QuickBooks API Error fetching vendors: ${response.Fault.Error.map(
							(e: { Message: string }) => e.Message,
						).join(', ')}`,
					);
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
		lineItems: Property.Array({
			displayName: 'Line Items',
			description: 'Details of the bill (expense categories). At least one line is required.',
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
						'The Id of the expense account. Use the "Find Account" action (filter by type Expense) to look this up.',
					required: true,
				}),
				classId: Property.ShortText({
					displayName: 'Class ID',
					description:
						'Optional. The Id of the class to tag this line with. Only available on QuickBooks Plus and Advanced plans with class tracking enabled for per-line transactions; on other plans this is ignored.',
					required: false,
				}),
			},
		}),
		txnDate: Property.DateTime({
			displayName: 'Bill Date',
			description: 'The date of the bill. Defaults to today if empty.',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			description: 'The date the payment is due. If empty, the vendor/company term is used.',
			required: false,
		}),
		docNumber: Property.ShortText({
			displayName: 'Bill Number',
			description: 'Reference number for the bill.',
			required: false,
		}),
		privateNote: Property.LongText({
			displayName: 'Memo (Private Note)',
			description: 'Internal note about the bill.',
			required: false,
		}),
	},
	async run(context) {
		const { access_token } = context.auth;
		const companyId = context.auth.props?.['companyId'] as string;

		const props = context.propsValue;

		const classTrackingPerLineEnabled = await isClassTrackingPerLineEnabled({
			accessToken: access_token,
			companyId,
		});

		const lines = (props['lineItems'] as any[]).map((line) => {
			if (!line['expenseAccountId']) {
				throw new Error('Expense Category/Account ID is required for each line.');
			}
			return {
				Amount: line['amount'],
				Description: line['description'],
				DetailType: line['detailType'],
				AccountBasedExpenseLineDetail: {
					AccountRef: { value: line['expenseAccountId'] } as QuickbooksRef,
					...(classTrackingPerLineEnabled &&
						line['classId'] && { ClassRef: { value: line['classId'] } as QuickbooksRef }),
				},
			};
		});

		if (lines.length === 0) {
			throw new Error('At least one line item is required.');
		}

		const billPayload: Partial<QuickbooksBill> = {
			VendorRef: { value: props['vendorRef'] } as QuickbooksRef,
			Line: lines,
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['dueDate'] && { DueDate: props['dueDate'].split('T')[0] }),
			...(props['docNumber'] && { DocNumber: props['docNumber'] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/bill#create-a-bill
		const response = await quickbooksApiCall<{
			Bill: QuickbooksBill;
			time: string;
			Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
		}>({
			accessToken: access_token,
			companyId,
			method: HttpMethod.POST,
			resourceUri: '/bill',
			body: billPayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error creating bill: ${response.Fault.Error.map(
					(e: any) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e: any) => e.Detail).join(', ')}`,
			);
		}

		return response.Bill;
	},
});

async function isClassTrackingPerLineEnabled({
	accessToken,
	companyId,
}: {
	accessToken: string;
	companyId: string;
}): Promise<boolean> {
	try {
		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/preferences
		const response = await quickbooksApiCall<{ Preferences?: QuickbooksPreferences }>({
			accessToken,
			companyId,
			method: HttpMethod.GET,
			resourceUri: '/preferences',
		});
		return Boolean(response.Preferences?.AccountingInfoPrefs?.ClassTrackingPerTxnLine);
	} catch {
		return false;
	}
}
