import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetJournalReportOutputSchema } from '../../../output-schemas';

export const getJournalReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_journal_report',
	outputSchema: quickbooksSandboxGetJournalReportOutputSchema,
	displayName: 'Get Journal Report',
	description: 'Runs the Journal report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the Journal report: every transaction in the period with its debit and credit lines per account, for a date range or named period. Pick Get General Ledger Report to see the same postings grouped by account. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,name,memo,account_name,debt_amt,credit_amt". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { startDate, endDate, dateMacro, sortBy, sortOrder, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'JournalReport',
			query: {
				start_date: startDate,
				end_date: endDate,
				date_macro: dateMacro,
				sort_by: sortBy,
				sort_order: sortOrder,
				columns,
			},
		});
	},
});
