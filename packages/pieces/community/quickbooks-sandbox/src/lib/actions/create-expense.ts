import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksFault, QuickbooksPurchase, QuickbooksPurchaseLine } from '../common/types';
import { createExpenseOutputSchema } from '../output-schemas';

export const createExpenseAction = createAction({
	auth: quickbooksAuth,
	name: 'create_expense',
	outputSchema: createExpenseOutputSchema,
	displayName: 'Create Expense',
	description: 'Creates an expense transaction (purchase) in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Record a new expense (purchase) paid from a chosen bank or credit-card account, with one or more account-based line items (each needs an amount and an expense account Id) and a payment type of cash, check, or credit card. Optionally attach a payee/vendor, payment date, and memo. Not idempotent: each call creates a new purchase, so guard against duplicates.',
		idempotent: false,
	},
	props: {
		accountRef: quickbooksProps.accountRef({ required: true }),
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
		entityRef: quickbooksProps.entityRef({ required: false }),
		txnDate: Property.DateTime({
			displayName: 'Payment Date',
			description: 'The date the expense occurred.',
			required: false,
		}),
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
						'The Id of the expense account. Use the "Find Account" action (filter by type Expense) to look this up.',
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
		const props = context.propsValue;

		const lines = (props['lineItems'] as {
			amount: number;
			description?: string;
			detailType: QuickbooksPurchaseLine['DetailType'];
			expenseAccountId?: string;
		}[]).map((line) => {
			const detail: QuickbooksPurchaseLine = {
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

		const expensePayload = {
			AccountRef: { value: props['accountRef'] },
			PaymentType: props['paymentType'],
			Line: lines,
			...(props['entityRef'] && { EntityRef: { value: props['entityRef'] } }),
			...(props['txnDate'] && { TxnDate: props['txnDate'].split('T')[0] }),
			...(props['privateNote'] && { PrivateNote: props['privateNote'] }),
		};

		const response = await quickbooksClient.request<{
			Purchase: QuickbooksPurchase;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/purchase',
			body: expensePayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error creating expense: ${response.Fault.Error.map(
					(e) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.Purchase;
	},
});
