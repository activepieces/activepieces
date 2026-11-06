import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCustomerBalanceDetailReportOutputSchema } from '../../../output-schemas';

export const getCustomerBalanceDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_customer_balance_detail_report',
	outputSchema: quickbooksSandboxGetCustomerBalanceDetailReportOutputSchema,
	displayName: 'Get Customer Balance Detail Report',
	description: 'Runs the Customer Balance Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Customer Balance Detail report: each customer\'s open invoices, payments and credits with a running balance, as of a date. Pick Get Customer Balance Report for one total per customer, or Get Aged Receivable Detail Report to bucket by days overdue. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		agingMethod: Property.StaticDropdown({
			displayName: 'Aging Method',
			description: 'Current ages balances from today, Report_Date ages them from Report Date. Defaults to Current.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'Current' },
					{ label: 'Report Date', value: 'Report_Date' },
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
		const { customer, department, reportDate, arPaid, agingMethod, term, startDueDate, endDueDate, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'CustomerBalanceDetail',
			query: {
				customer,
				department,
				report_date: reportDate,
				arpaid: arPaid,
				aging_method: agingMethod,
				term,
				start_duedate: startDueDate,
				end_duedate: endDueDate,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
