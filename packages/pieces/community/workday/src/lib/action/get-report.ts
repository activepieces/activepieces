import { QueryParams } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayGetReport } from '../common';
import { flattenRecord } from '../common/fields';
import { reportIdProperty } from '../common/props';

export const getReport = createAction({
	auth: workdayAuth,
	name: 'get_report',
	displayName: 'Get Report',
	description: 'Fetches a Workday report by ID or web service alias.',
	audience: 'both',
	aiMetadata: {
		description:
			'Runs a published Workday custom report, addressed by its report ID or web service alias, and returns its rows, optionally passing report prompt values as JSON. Use when the data is already shaped by a report definition in the tenant; prefer Find Records (WQL) or Get Report using WQL (Batch) when the query can be expressed in WQL instead. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		reportId: reportIdProperty,
		reportParameters: Property.Json({
			displayName: 'Report Parameters (JSON)',
			description: 'Optional report prompt values as JSON key-value pairs.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const report = await workdayGetReport(
			auth,
			propsValue.reportId,
			propsValue.reportParameters as QueryParams | undefined,
		);
		const rows = Array.isArray(report['data'])
			? (report['data'] as Record<string, unknown>[])
			: Array.isArray(report['Report_Entry'])
			? (report['Report_Entry'] as Record<string, unknown>[])
			: [report];

		return {
			total_count: rows.length,
			report_id: propsValue.reportId,
			records: rows.map((row) => flattenRecord(row)),
		};
	},
});
