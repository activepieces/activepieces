import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../lib/auth';
import { quickbooksApiCall } from '../lib/common';
import { QuickbooksReport } from '../lib/types';

export const readAgingReportAction = createAction({
	auth: quickbooksAuth,
	name: 'read_aging_report',
	displayName: 'Read AR/AP Aging',
	description: 'Reads an accounts receivable or accounts payable aging report from QuickBooks.',
	audience: 'both',
	aiMetadata: {
		description: 'Fetch an aging report showing outstanding receivables (money owed to the company) or payables (money the company owes), bucketed by how overdue they are. Choose the report type, optionally set the as-of date, the number of days per aging bucket, the number of buckets, the aging method, and a minimum past-due days filter. Returns both the raw QuickBooks report and a flattened "rows" array (one object per report line, columns as keys) ready for reconciliation or spreadsheet export. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		reportType: Property.StaticDropdown({
			displayName: 'Report',
			required: true,
			options: {
				options: [
					{ label: 'A/R Aging Summary', value: 'AgedReceivables' },
					{ label: 'A/R Aging Detail', value: 'AgedReceivableDetail' },
					{ label: 'A/P Aging Summary', value: 'AgedPayables' },
					{ label: 'A/P Aging Detail', value: 'AgedPayableDetail' },
				],
			},
			defaultValue: 'AgedReceivables',
		}),
		reportDate: Property.DateTime({
			displayName: 'As Of Date',
			description: 'The date to age balances against. Defaults to today if empty.',
			required: false,
		}),
		agingPeriod: Property.Number({
			displayName: 'Days Per Period',
			description: 'Number of days in each aging bucket (e.g. 30).',
			required: false,
		}),
		numPeriods: Property.Number({
			displayName: 'Number of Periods',
			description: 'How many aging buckets to include.',
			required: false,
		}),
		agingMethod: Property.StaticDropdown({
			displayName: 'Aging Method',
			description: 'Whether buckets are calculated from the report date or from each transaction\'s due date.',
			required: false,
			options: {
				options: [
					{ label: 'Report Date', value: 'Report_Date' },
					{ label: 'Current', value: 'Current' },
				],
			},
		}),
		pastDue: Property.Number({
			displayName: 'Minimum Days Past Due',
			description: 'Only include transactions overdue by at least this many days.',
			required: false,
		}),
	},
	async run(context) {
		const { reportType, reportDate, agingPeriod, numPeriods, agingMethod, pastDue } = context.propsValue;
		const companyId = context.auth.props?.['companyId'];

		if (!companyId) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/reports/agedreceivables
		const response = await quickbooksApiCall<
			QuickbooksReport & {
				Fault?: { Error: { Message: string; Detail?: string; code: string }[]; type: string };
			}
		>({
			accessToken: context.auth.access_token,
			companyId: companyId as string,
			method: HttpMethod.GET,
			resourceUri: `/reports/${reportType}`,
			query: {
				...(reportDate && { report_date: reportDate.split('T')[0] }),
				...(agingPeriod != null && { aging_period: String(agingPeriod) }),
				...(numPeriods != null && { num_periods: String(numPeriods) }),
				...(agingMethod && { aging_method: agingMethod }),
				...(pastDue != null && { past_due: String(pastDue) }),
			},
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error fetching report: ${response.Fault.Error.map(
					(e: { Message: string }) => e.Message,
				).join(', ')}`,
			);
		}

		return {
			...response,
			rows: flattenAgingReportRows(response),
		};
	},
});

function toColumnKey(title: string | undefined, index: number): string {
	if (!title) {
		return `column_${index}`;
	}
	const key = title
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	return key || `column_${index}`;
}

function flattenAgingReportRows(report: QuickbooksReport): Record<string, string | number>[] {
	const columns = ((report.Columns as { Column?: QuickbooksReportColumn[] } | undefined)?.Column) ?? [];
	const headers = columns.map((column, index) => toColumnKey(column.ColTitle ?? column.ColType, index));

	const flatRows: Record<string, string | number>[] = [];

	const pushColData = (colData: QuickbooksReportColData[] | undefined, rowType: 'Data' | 'Summary') => {
		if (!colData || colData.length === 0) {
			return;
		}
		const flat: Record<string, string | number> = { row_type: rowType };
		colData.forEach((col, index) => {
			const key = headers[index] ?? `column_${index}`;
			flat[key] = col.value ?? '';
			if (col.id) {
				flat[`${key}_id`] = col.id;
			}
		});
		flatRows.push(flat);
	};

	const walk = (rows: QuickbooksReportRow[] | undefined) => {
		if (!rows) {
			return;
		}
		for (const row of rows) {
			pushColData(row.ColData, 'Data');
			walk(row.Rows?.Row);
			pushColData(row.Summary?.ColData, 'Summary');
		}
	};

	walk((report.Rows as { Row?: QuickbooksReportRow[] } | undefined)?.Row);

	return flatRows;
}

interface QuickbooksReportColumn {
	ColTitle?: string;
	ColType?: string;
}

interface QuickbooksReportColData {
	value?: string;
	id?: string;
}

interface QuickbooksReportRow {
	ColData?: QuickbooksReportColData[];
	Rows?: { Row?: QuickbooksReportRow[] };
	Summary?: { ColData?: QuickbooksReportColData[] };
}
