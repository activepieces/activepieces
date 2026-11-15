import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetVendorBalanceDetailReportOutputSchema } from '../../../output-schemas';

export const getVendorBalanceDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_vendor_balance_detail_report',
	outputSchema: quickbooksSandboxGetVendorBalanceDetailReportOutputSchema,
	displayName: 'Get Vendor Balance Detail Report',
	description: 'Runs the Vendor Balance Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Vendor Balance Detail report: each vendor\'s open bills, payments and credits with a running balance, as of a date. Pick Get Vendor Balance Report for one total per vendor, or Get Aged Payable Detail Report to bucket by days overdue. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		vendor: Property.ShortText({
			displayName: 'Vendor IDs',
			description: 'Comma-separated vendor ids to include. Use List Vendors to find them.',
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
		apPaid: Property.StaticDropdown({
			displayName: 'Bill Status',
			description: 'Include all, paid or unpaid bills.',
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
		term: Property.ShortText({
			displayName: 'Term IDs',
			description: 'Comma-separated payment term ids to include. Use List Terms to find them.',
			required: false,
		}),
		startDueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Start Due Date',
			description: 'Only include transactions due on or after this date, YYYY-MM-DD.',
		}),
		endDueDate: quickbooksAiProps.date({
			required: false,
			displayName: 'End Due Date',
			description: 'Only include transactions due on or before this date, YYYY-MM-DD.',
		}),
		dueDateMacro: Property.ShortText({
			displayName: 'Due Date Macro',
			description: 'Named due-date period instead of due dates, e.g. "This Month", "Last Month".',
			required: false,
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
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,due_date,subt_amount,subt_open_bal,rbal_open_bal". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { vendor, department, reportDate, dateMacro, accountingMethod, apPaid, term, startDueDate, endDueDate, dueDateMacro, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'VendorBalanceDetail',
			query: {
				vendor,
				department,
				report_date: reportDate,
				date_macro: dateMacro,
				accounting_method: accountingMethod,
				appaid: apPaid,
				term,
				start_duedate: startDueDate,
				end_duedate: endDueDate,
				duedate_macro: dueDateMacro,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
