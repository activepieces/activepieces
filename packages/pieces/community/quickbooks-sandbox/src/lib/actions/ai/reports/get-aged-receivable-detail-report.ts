import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAgedReceivableDetailReportOutputSchema } from '../../../output-schemas';

export const getAgedReceivableDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_aged_receivable_detail_report',
	outputSchema: quickbooksSandboxGetAgedReceivableDetailReportOutputSchema,
	displayName: 'Get Aged Receivable Detail Report',
	description: 'Runs the A/R Aging Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the A/R Aging Detail report: each open invoice and credit, grouped into aging buckets by how overdue it is. Pick it over Get Aged Receivables Report when the individual transactions are needed. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
		idempotent: true,
	},
	props: {
		reportDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Report Date',
			description: 'Date to age the open balances as of, YYYY-MM-DD. Defaults to today.',
		}),
		agingPeriod: Property.Number({
			displayName: 'Days Per Aging Period',
			description: 'Number of days in each aging bucket. Defaults to 30.',
			required: false,
		}),
		numPeriods: Property.Number({
			displayName: 'Number of Aging Periods',
			description: 'Number of aging buckets. Defaults to 4.',
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
		pastDue: Property.Number({
			displayName: 'Minimum Days Past Due',
			description: 'Only include transactions at least this many days past due.',
			required: false,
		}),
		customer: Property.ShortText({
			displayName: 'Customer IDs',
			description: 'Comma-separated customer ids to include. Use List Customers to find them.',
			required: false,
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
		columns: Property.ShortText({
			displayName: 'Columns',
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,cust_name,due_date,past_due,subt_amount,subt_open_bal". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { reportDate, agingPeriod, numPeriods, agingMethod, pastDue, customer, term, startDueDate, endDueDate, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'AgedReceivableDetail',
			query: {
				report_date: reportDate,
				aging_period: agingPeriod,
				num_periods: numPeriods,
				aging_method: agingMethod,
				past_due: pastDue,
				customer,
				term,
				start_duedate: startDueDate,
				end_duedate: endDueDate,
				columns,
			},
		});
	},
});
