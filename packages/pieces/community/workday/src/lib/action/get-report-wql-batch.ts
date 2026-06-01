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
