import { createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdayWqlRequestAll } from '../common';
import { flattenRecord } from '../common/fields';
import { wqlQueryProperty } from '../common/props';

export const getReportWqlBatch = createAction({
	auth: workdayAuth,
	name: 'get_report_wql_batch',
	displayName: 'Get Report using WQL (Batch)',
	description:
		'Executes a WQL query and returns all rows (use for report-style datasets).',
	audience: 'both',
	aiMetadata: {
		description:
			'Runs a Workday Query Language (WQL) query and pages through every result row, returning the complete set in one call. Use for report-style extracts where the whole dataset is needed rather than the single page Find Records (WQL) returns, and use Get Report when the data comes from a published report definition. Requires a valid WQL statement. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		query: wqlQueryProperty,
	},
	async run({ auth, propsValue }) {
		const records = await workdayWqlRequestAll(auth, propsValue.query);
		const flattened = records.map((row) => flattenRecord(row));
		return {
			total_count: flattened.length,
			records: flattened,
		};
	},
});
