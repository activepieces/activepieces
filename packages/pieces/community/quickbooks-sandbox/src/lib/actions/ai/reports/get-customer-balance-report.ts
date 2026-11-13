import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCustomerBalanceReportOutputSchema } from '../../../output-schemas';

export const getCustomerBalanceReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_customer_balance_report',
	outputSchema: quickbooksSandboxGetCustomerBalanceReportOutputSchema,
	displayName: 'Get Customer Balance Report',
	description: 'Runs the Customer Balance Summary report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Customer Balance Summary report: the open balance each customer owes, as of a date. Pick Get Customer Balance Detail Report for the transactions behind each balance. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		customer: Property.ShortText({
			displayName: 'Customer IDs',
			description: 'Comma-separated customer ids to include. Use List Customers to find them.',
			required: false,
		}),
		department: Property.ShortText({
			displayName: 'Department IDs',
			description: 'Comma-separated department (location) ids to include. Use List Departments to find them.',
			required: false,
		}),
		reportDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Report Date',
			description: 'Date the balances are as of, YYYY-MM-DD. Defaults to today.',
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
		arPaid: Property.StaticDropdown({
			displayName: 'Invoice Status',
			description: 'Include all, paid or unpaid invoices.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'All' },
					{ label: 'Paid', value: 'Paid' },
					{ label: 'Unpaid', value: 'Unpaid' },
				],
			},
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
	},
	async run(context) {
		const { customer, department, reportDate, dateMacro, accountingMethod, arPaid, summarizeColumnBy, sortOrder } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'CustomerBalance',
			query: {
				customer,
				department,
				report_date: reportDate,
				date_macro: dateMacro,
				accounting_method: accountingMethod,
				arpaid: arPaid,
				summarize_column_by: summarizeColumnBy,
				sort_order: sortOrder,
			},
		});
	},
});
