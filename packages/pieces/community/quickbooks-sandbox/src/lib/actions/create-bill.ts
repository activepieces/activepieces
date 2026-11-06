import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksAuthValue, QuickbooksBill, QuickbooksFault, QuickbooksPreferences } from '../common/types';
import { createBillOutputSchema } from '../output-schemas';

export const createBillAction = createAction({
	auth: quickbooksAuth,
	name: 'create_bill',
	outputSchema: createBillOutputSchema,
	displayName: 'Create Bill',
	description: 'Creates a bill (accounts payable) in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Record a new bill owed to a vendor, with one or more account-based line items (each needs an amount and an expense account Id, and optionally a Class Id on QuickBooks Plus/Advanced). Optionally set the bill date, due date, bill number, and memo. Not idempotent: each call creates a new bill, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		vendorRef: quickbooksProps.vendorRef({ required: true }),
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
		const props = context.propsValue;

		const classTrackingPerLineEnabled = await isClassTrackingPerLineEnabled({ auth: context.auth });

		const lines = (props['lineItems'] as {
			amount: number;
			description?: string;
			detailType: string;
			expenseAccountId?: string;
			classId?: string;
		}[]).map((line) => {
			if (!line['expenseAccountId']) {
				throw new Error('Expense Category/Account ID is required for each line.');
			}
			return {
				Amount: line['amount'],
				Description: line['description'],
				DetailType: line['detailType'],
				AccountBasedExpenseLineDetail: {
					AccountRef: { value: line['expenseAccountId'] },
					...(classTrackingPerLineEnabled &&
						line['classId'] && { ClassRef: { value: line['classId'] } }),
				},
			};
		});

		if (lines.length === 0) {
			throw new Error('At least one line item is required.');
		}

		const billPayload = {
			VendorRef: { value: props['vendorRef'] },
			Line: lines,
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['dueDate'] && { DueDate: props['dueDate'].split('T')[0] }),
			...(props['docNumber'] && { DocNumber: props['docNumber'] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const response = await quickbooksClient.request<{
			Bill: QuickbooksBill;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/bill',
			body: billPayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error creating bill: ${response.Fault.Error.map(
					(e) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.Bill;
	},
});

async function isClassTrackingPerLineEnabled({ auth }: { auth: QuickbooksAuthValue }): Promise<boolean> {
	try {
		const response = await quickbooksClient.request<{ Preferences?: QuickbooksPreferences }>({
			auth,
			method: HttpMethod.GET,
			path: '/preferences',
		});
		return Boolean(response.Preferences?.AccountingInfoPrefs?.ClassTrackingPerTxnLine);
	} catch {
		return false;
	}
}
