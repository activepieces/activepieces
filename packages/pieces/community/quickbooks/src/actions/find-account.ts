import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksQuery, QuickbooksEntityResponse } from '../lib/common';
import { QuickbooksAccount } from '../lib/types';

export const findAccountAction = createAction({
	auth: quickbooksAuth,
	name: 'find_account',
	displayName: 'Find Account',
	description: 'List or search the chart of accounts to get an account Id (e.g. an expense account for a bill).',
	audience: 'both',
	aiMetadata: {
		description: 'List QuickBooks chart-of-accounts entries to resolve an account name to its Id. Optionally filter by a name substring and/or account type (e.g. Expense, Bank, Accounts Payable). Use this to find the expense-account Id required by Create Bill / Create Expense line items. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		search_term: Property.ShortText({
			displayName: 'Account Name Contains',
			description: 'Optional. Filter accounts whose name contains this text.',
			required: false,
		}),
		accountType: Property.StaticDropdown({
			displayName: 'Account Type',
			description: 'Optional. Filter by account type.',
			required: false,
			options: {
				options: [
					{ label: 'Bank', value: 'Bank' },
					{ label: 'Accounts Receivable', value: 'Accounts Receivable' },
					{ label: 'Other Current Asset', value: 'Other Current Asset' },
					{ label: 'Fixed Asset', value: 'Fixed Asset' },
					{ label: 'Other Asset', value: 'Other Asset' },
					{ label: 'Accounts Payable', value: 'Accounts Payable' },
					{ label: 'Credit Card', value: 'Credit Card' },
					{ label: 'Other Current Liability', value: 'Other Current Liability' },
					{ label: 'Long Term Liability', value: 'Long Term Liability' },
					{ label: 'Equity', value: 'Equity' },
					{ label: 'Income', value: 'Income' },
					{ label: 'Cost of Goods Sold', value: 'Cost of Goods Sold' },
					{ label: 'Expense', value: 'Expense' },
					{ label: 'Other Income', value: 'Other Income' },
					{ label: 'Other Expense', value: 'Other Expense' },
				],
			},
		}),
	},
	async run(context) {
		const { search_term, accountType } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const conditions = ['Active = true'];
		if (search_term) {
			conditions.push(`Name LIKE '%${search_term.replace(/'/g, "\\'")}%'`);
		}
		if (accountType) {
			conditions.push(`AccountType = '${accountType}'`);
		}
		const query = `SELECT * FROM Account WHERE ${conditions.join(' AND ')} MAXRESULTS 1000`;

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account#query-an-account
		const response = await quickbooksQuery<QuickbooksEntityResponse<QuickbooksAccount>>({
			accessToken: context.auth.access_token,
			companyId: companyId as string,
			query,
		});

		const accounts = response?.QueryResponse?.['Account'] ?? [];
		return {
			found: accounts.length > 0,
			result: accounts,
		};
	},
});
