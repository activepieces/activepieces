import { createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const getReportWqlBatchAction = createAction({
	auth: workdayAuth,
	name: 'get_report_wql_batch',
	classification: 'SEARCH',
	displayName: 'Get Report using WQL (Batch)',
	description: 'Executes a WQL query and returns all rows (use for report-style datasets).',
	audience: 'both',
	aiMetadata: {
		description:
			'Runs a Workday Query Language (WQL) query and pages through every result row, returning the complete set in one call. Use for report-style extracts where the whole dataset is needed rather than the single page Find Records (WQL) returns, and use Get Report when the data comes from a published report definition. Requires a valid WQL statement. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		query: workdayProps.wqlQuery({ required: true }),
	},
	async run({ auth, propsValue }) {
		const records = await workdayApi.runWqlAll({ auth, query: propsValue.query });
		const flattened = records.map((row) => workdayUtils.flattenRecord({ value: row }));
		return {
			total_count: flattened.length,
			records: flattened,
		};
	},
});
