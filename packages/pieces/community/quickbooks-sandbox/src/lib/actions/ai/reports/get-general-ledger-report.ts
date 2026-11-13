import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetGeneralLedgerReportOutputSchema } from '../../../output-schemas';

export const getGeneralLedgerReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_general_ledger_report',
	outputSchema: quickbooksSandboxGetGeneralLedgerReportOutputSchema,
	displayName: 'Get General Ledger Report',
	description: 'Runs the General Ledger report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the General Ledger report: every transaction posted to each account, with running balances, for a date range or named period. Filter by account, account type, customer, vendor, class or department to keep it small; an unfiltered year can be very large. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		startDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Date',
			description: 'First day of the report, YYYY-MM-DD. Use with End Date, or use Date Macro instead.',
		}),
		endDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Date',
			description: 'Last day of the report, YYYY-MM-DD.',
		}),
		dateMacro: Property.ShortText({
			displayName: 'Date Macro',
			description: 'Named period instead of dates, e.g. "Today", "This Month", "Last Month", "This Fiscal Year-to-date", "Last Fiscal Year".',
			required: false,
		}),
		accountingMethod: Property.StaticDropdown({
			displayName: 'Accounting Method',
			description: 'Cash or Accrual. Defaults to the company setting.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Accrual', value: 'Accrual' },
					{ label: 'Cash', value: 'Cash' },
				],
			},
		}),
		account: Property.ShortText({
			displayName: 'Account IDs',
			description: 'Comma-separated account ids to include. Use List Accounts to find them.',
			required: false,
		}),
		sourceAccount: Property.ShortText({
			displayName: 'Source Account IDs',
			description: 'Comma-separated source account ids to include. Use List Accounts to find them.',
			required: false,
		}),
		accountType: Property.ShortText({
			displayName: 'Account Type',
			description: 'Account type to include, e.g. Bank, AccountsReceivable, OtherCurrentAsset, FixedAsset, AccountsPayable, CreditCard, OtherCurrentLiability, LongTermLiability, Equity, Income, CostOfGoodsSold, Expense, OtherIncome, OtherExpense.',
			required: false,
		}),
		customer: Property.ShortText({
			displayName: 'Customer IDs',
			description: 'Comma-separated customer ids to include. Use List Customers to find them.',
			required: false,
		}),
		vendor: Property.ShortText({
			displayName: 'Vendor IDs',
			description: 'Comma-separated vendor ids to include. Use List Vendors to find them.',
			required: false,
		}),
		classIds: Property.ShortText({
			displayName: 'Class IDs',
			description: 'Comma-separated class ids to include. Use List Classes to find them.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department IDs',
			description: 'Comma-separated department (location) ids to include. Use List Departments to find them.',
			required: false,
		}),
		summarizeColumnBy: Property.StaticDropdown({
			displayName: 'Summarize Columns By',
			description: 'Split the amounts into columns by period. Defaults to Total.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Total', value: 'Total' },
					{ label: 'Month', value: 'Month' },
					{ label: 'Week', value: 'Week' },
					{ label: 'Days', value: 'Days' },
					{ label: 'Quarter', value: 'Quarter' },
					{ label: 'Year', value: 'Year' },
				],
			},
		}),
		sortBy: Property.ShortText({
			displayName: 'Sort By',
			description: 'Column code to sort the rows by, e.g. "tx_date".',
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
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name,memo,split_acc,subt_nat_amount,rbal_nat_amount". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, accountingMethod, account, sourceAccount, accountType, customer, vendor, classIds, department, summarizeColumnBy, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'GeneralLedger',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				accounting_method: accountingMethod,
				account,
				source_account: sourceAccount,
				account_type: accountType,
				customer,
				vendor,
				class: classIds,
				department,
				summarize_column_by: summarizeColumnBy,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
