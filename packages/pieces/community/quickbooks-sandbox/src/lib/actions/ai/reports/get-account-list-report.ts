import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAccountListReportOutputSchema } from '../../../output-schemas';

export const getAccountListReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_account_list_report',
	outputSchema: quickbooksSandboxGetAccountListReportOutputSchema,
	displayName: 'Get Account List Report',
	description: 'Runs the Account List report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Account List report: every account in the chart of accounts with its type, detail type, description and balance, filterable by account type, status and creation or modification date. Pick it for a chart-of-accounts snapshot; use List Accounts for full account records. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		accountType: Property.ShortText({
			displayName: 'Account Type',
			description: 'Account type to include, e.g. Bank, AccountsReceivable, OtherCurrentAsset, FixedAsset, AccountsPayable, CreditCard, OtherCurrentLiability, LongTermLiability, Equity, Income, CostOfGoodsSold, Expense, OtherIncome, OtherExpense.',
			required: false,
		}),
		accountStatus: Property.StaticDropdown({
			displayName: 'Account Status',
			description: 'Active (Not_Deleted) or inactive (Deleted) accounts. Defaults to active.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'Not_Deleted' },
					{ label: 'Inactive', value: 'Deleted' },
				],
			},
		}),
		startDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Date',
			description: 'Only include accounts created on or after this date, YYYY-MM-DD.',
		}),
		endDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Date',
			description: 'Only include accounts created on or before this date, YYYY-MM-DD.',
		}),
		createDateMacro: Property.ShortText({
			displayName: 'Created Date Macro',
			description: 'Named creation period instead of Start Date and End Date, e.g. "This Month", "Last Year".',
			required: false,
		}),
		startModDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Modified On or After',
			description: 'Only include accounts last modified on or after this date, YYYY-MM-DD.',
		}),
		endModDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Modified On or Before',
			description: 'Only include accounts last modified on or before this date, YYYY-MM-DD.',
		}),
		modDateMacro: Property.ShortText({
			displayName: 'Modified Date Macro',
			description: 'Named last-modified period instead of the modified dates, e.g. "This Month".',
			required: false,
		}),
		sortBy: Property.ShortText({
			displayName: 'Sort By',
			description: 'Column code to sort the rows by, e.g. "account_name".',
			required: false,
		}),
		sortOrder: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'Ascending or descending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Ascending', value: 'ascend' },
					{ label: 'Descending', value: 'descend' },
				],
			},
		}),
		columns: Property.ShortText({
			displayName: 'Columns',
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "account_name,account_type,detail_acc_type,account_desc,account_bal". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { accountType, accountStatus, startDate, endDate, createDateMacro, startModDate, endModDate, modDateMacro, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'AccountList',
			query: {
				account_type: accountType,
				account_status: accountStatus,
				start_date: startDate,
				end_date: endDate,
				createdate_macro: createDateMacro,
				start_moddate: startModDate,
				end_moddate: endModDate,
				moddate_macro: modDateMacro,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
