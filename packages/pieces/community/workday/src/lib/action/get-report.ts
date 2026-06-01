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
