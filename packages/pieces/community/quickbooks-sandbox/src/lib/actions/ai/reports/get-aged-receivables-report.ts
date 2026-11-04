import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAgedReceivablesReportOutputSchema } from '../../../output-schemas';

export const getAgedReceivablesReportAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_aged_receivables_report',
	outputSchema: quickbooksSandboxGetAgedReceivablesReportOutputSchema,
	displayName: 'Get Aged Receivables Report',
	description: 'Runs the A/R Aging Summary report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the A/R Aging Summary report: what each customer owes, totalled per aging bucket (current, 1-30, 31-60 days and so on). Pick Get Aged Receivable Detail Report for the individual invoices. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
			description: 'Date to age the open balances as of, YYYY-MM-DD. Defaults to today.',
		}),
		dateMacro: Property.ShortText({
			displayName: 'Date Macro',
			description: 'Named period instead of dates, e.g. "Today", "This Month", "Last Month", "This Fiscal Year-to-date", "Last Fiscal Year".',
			required: false,
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
		const { customer, department, reportDate, dateMacro, agingMethod, summarizeColumnBy, sortOrder } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'AgedReceivables',
			query: {
				customer,
				department,
				report_date: reportDate,
				date_macro: dateMacro,
				aging_method: agingMethod,
				summarize_column_by: summarizeColumnBy,
				sort_order: sortOrder,
			},
		});
	},
});
