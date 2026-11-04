import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetInventoryValuationSummaryReportOutputSchema } from '../../../output-schemas';

export const getInventoryValuationSummaryReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_inventory_valuation_summary_report',
	outputSchema: quickbooksSandboxGetInventoryValuationSummaryReportOutputSchema,
	displayName: 'Get Inventory Valuation Summary Report',
	description: 'Runs the Inventory Valuation Summary report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Inventory Valuation Summary report: quantity on hand, value and average cost of each inventory item as of a date. Needs QuickBooks Online Plus or Advanced (US) with inventory tracking on. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		reportDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Report Date',
			description: 'Date the quantities and values are as of, YYYY-MM-DD. Defaults to today.',
		}),
		dateMacro: Property.ShortText({
			displayName: 'Date Macro',
			description: 'Named period instead of dates, e.g. "Today", "This Month", "Last Month", "This Fiscal Year-to-date", "Last Fiscal Year".',
			required: false,
		}),
		item: Property.ShortText({
			displayName: 'Item IDs',
			description: 'Comma-separated item ids to include. Use List Items to find them.',
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
		const { reportDate, dateMacro, item, summarizeColumnBy, sortOrder } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'InventoryValuationSummary',
			query: {
				report_date: reportDate,
				date_macro: dateMacro,
				item,
				summarize_column_by: summarizeColumnBy,
				sort_order: sortOrder,
			},
		});
	},
});
