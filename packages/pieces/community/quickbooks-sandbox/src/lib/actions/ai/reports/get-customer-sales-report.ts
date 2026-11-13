import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetCustomerSalesReportOutputSchema } from '../../../output-schemas';

export const getCustomerSalesReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_customer_sales_report',
	outputSchema: quickbooksSandboxGetCustomerSalesReportOutputSchema,
	displayName: 'Get Customer Sales Report',
	description: 'Runs the Sales by Customer Summary report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Sales by Customer Summary report: sales totals per customer for a date range or named period. Pick Get Customer Income Report to also see expenses and net income per customer. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		summarizeColumnBy: Property.StaticDropdown({
			displayName: 'Summarize Columns By',
			description: 'Split the amounts into columns. Defaults to Total.',
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
					{ label: 'Customers', value: 'Customers' },
					{ label: 'Vendors', value: 'Vendors' },
					{ label: 'Classes', value: 'Classes' },
					{ label: 'Departments', value: 'Departments' },
					{ label: 'Employees', value: 'Employees' },
					{ label: 'Product/Service', value: 'ProductsAndServices' },
				],
			},
		}),
		customer: Property.ShortText({
			displayName: 'Customer IDs',
			description: 'Comma-separated customer ids to include. Use List Customers to find them.',
			required: false,
		}),
		item: Property.ShortText({
			displayName: 'Item IDs',
			description: 'Comma-separated item ids to include. Use List Items to find them.',
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
		const { startDate, endDate, dateMacro, accountingMethod, summarizeColumnBy, customer, item, classIds, department, sortOrder } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'CustomerSales',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				accounting_method: accountingMethod,
				summarize_column_by: summarizeColumnBy,
				customer,
				item,
				class: classIds,
				department,
				sort_order: sortOrder,
			},
		});
	},
});
