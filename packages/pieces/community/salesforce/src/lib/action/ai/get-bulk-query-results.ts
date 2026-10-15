import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { bulkUtils } from '../../common/bulk';
import { getBulkQueryResultsOutputSchema } from '../../output-schemas';

export const getBulkQueryResults = createAction({
	auth: salesforceAuth,
	name: 'get_bulk_query_results',
	classification: 'READ',
	displayName: 'Get Bulk Query Results',
	description: 'Get one page of rows from a completed Bulk API 2.0 query job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one page of rows from a Bulk API 2.0 query job once Get Bulk Query Job reports JobComplete. Pass the returned next_locator to fetch the next page; next_locator is null when there are no more rows. Page size defaults to 1000 and is capped at 10000. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getBulkQueryResultsOutputSchema,
	props: {
		job_id: Property.ShortText({
			displayName: 'Job ID',
			required: true,
		}),
		locator: Property.ShortText({
			displayName: 'Locator',
			description: 'next_locator from the previous page. Leave empty for the first page.',
			required: false,
		}),
		max_records: Property.Number({
			displayName: 'Max Records',
			description: 'Rows per page (default 1000, max 10000).',
			required: false,
			defaultValue: 1000,
		}),
	},
	async run(context) {
		const jobId = salesforceUtils.assertId({ value: context.propsValue.job_id, fieldName: 'Job ID' });
		const maxRecords = Math.min(Math.max(Math.floor(context.propsValue.max_records ?? 1000), 1), 10000);
		const locator = context.propsValue.locator?.trim();
		const params = new URLSearchParams({ maxRecords: String(maxRecords), ...(locator ? { locator } : {}) });
		const response = await callSalesforceApi<string>(
			HttpMethod.GET,
			context.auth,
			`${bulkUtils.BULK_API_PATH}/query/${jobId}/results?${params.toString()}`,
			undefined,
			{ responseType: 'text' }
		);
		const rows = bulkUtils.parseCsv(typeof response.body === 'string' ? response.body : '');
		const header = response.headers?.['sforce-locator'];
		const nextLocator = Array.isArray(header) ? header[0] : header;
		return {
			rows,
			count: rows.length,
			next_locator: !nextLocator || nextLocator === 'null' ? null : nextLocator,
		};
	},
});
