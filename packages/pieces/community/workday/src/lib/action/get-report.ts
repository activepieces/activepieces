import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayGetReport } from '../common';
import { flattenRecord } from '../common/fields';
import { reportIdProperty, reportParametersProperty } from '../common/props';

export const getReport = createAction({
	auth: workdayAuth,
	name: 'get_report',
	classification: 'READ',
	displayName: 'Get Report',
	description: 'Runs a Workday custom report through Reports-as-a-Service (RaaS).',
	audience: 'both',
	aiMetadata: {
		description:
			'Runs a Workday custom report that is enabled as a web service (RaaS), addressed by its RaaS URL or `owner/report_name`, and returns its rows as JSON or the raw CSV, optionally passing prompt values keyed by prompt XML alias. Use when the data is already shaped by a report definition in the tenant; prefer Find Records (WQL) or Get Report using WQL (Batch) when the query can be expressed in WQL instead. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		reportId: reportIdProperty,
		reportParameters: reportParametersProperty,
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'JSON returns the rows; CSV returns the report as CSV text.',
			required: false,
			defaultValue: 'json',
			options: {
				disabled: false,
				options: [
					{ label: 'JSON', value: 'json' },
					{ label: 'CSV', value: 'csv' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const report = await workdayGetReport({
			auth,
			report: propsValue.reportId,
			parameters: propsValue.reportParameters,
			format: propsValue.format === 'csv' ? 'csv' : 'json',
		});
		if (report.format === 'csv') {
			return { report_id: report.reportPath, csv: report.csv };
		}
		return {
			total_count: report.rows.length,
			report_id: report.reportPath,
			records: report.rows.map((row) => flattenRecord(row)),
		};
	},
});
