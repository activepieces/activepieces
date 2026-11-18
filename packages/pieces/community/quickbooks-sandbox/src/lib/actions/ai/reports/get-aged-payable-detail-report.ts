import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksSandboxGetAgedPayableDetailReportOutputSchema } from '../../../output-schemas';

export const getAgedPayableDetailReportAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_get_aged_payable_detail_report',
	outputSchema: quickbooksSandboxGetAgedPayableDetailReportOutputSchema,
	displayName: 'Get Aged Payable Detail Report',
	description: 'Runs the A/P Aging Detail report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Runs the A/P Aging Detail report: each unpaid bill and vendor credit, grouped into aging buckets by how overdue it is. Pick it over Get Aged Payables Report when the individual transactions are needed. Returns QuickBooks\' report body: Header, Columns and nested Rows.',
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
		pastDue: Property.Number({
			displayName: 'Minimum Days Past Due',
			description: 'Only include transactions at least this many days past due.',
			required: false,
		}),
		vendor: Property.ShortText({
			displayName: 'Vendor IDs',
			description: 'Comma-separated vendor ids to include. Use List Vendors to find them.',
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
		columns: Property.ShortText({
			displayName: 'Columns',
			description: 'Comma-separated column codes to show instead of the default columns, e.g. "tx_date,txn_type,doc_num,vend_name,due_date,past_due,subt_amount,subt_open_bal". Each column\'s code is the ColKey in the Columns of a default run.',
			required: false,
		}),
	},
	async run(context) {
		const { reportDate, agingPeriod, numPeriods, pastDue, vendor, term, startDueDate, endDueDate, accountingMethod, columns } = context.propsValue;
		return await quickbooksApi.getReport({
			auth: context.auth,
			report: 'AgedPayableDetail',
			query: {
				report_date: reportDate,
				aging_period: agingPeriod,
				num_periods: numPeriods,
				past_due: pastDue,
				vendor,
				term,
				start_duedate: startDueDate,
				end_duedate: endDueDate,
				accounting_method: accountingMethod,
				columns,
			},
		});
	},
});
