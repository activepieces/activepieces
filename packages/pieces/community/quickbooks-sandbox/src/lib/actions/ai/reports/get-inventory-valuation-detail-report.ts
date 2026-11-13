import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetInventoryValuationDetailReportOutputSchema } from '../../../output-schemas';

export const getInventoryValuationDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_inventory_valuation_detail_report',
	outputSchema: quickbooksSandboxGetInventoryValuationDetailReportOutputSchema,
	displayName: 'Get Inventory Valuation Detail Report',
	description: 'Runs the Inventory Valuation Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Inventory Valuation Detail report: each transaction that changed the quantity or value of an inventory item, for a date range or named period. Needs QuickBooks Online Plus or Advanced (US) with inventory tracking on. Pick Get Inventory Valuation Summary Report for one line per item. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		columns: Property.ShortText({
			displayName: 'Columns',
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'InventoryValuationDetail',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				columns,
			},
		});
	},
});
