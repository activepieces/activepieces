import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { bulkUtils } from '../../common/bulk';
import { getBulkIngestResultsOutputSchema } from '../../output-schemas';

export const getBulkIngestResults = createAction({
	auth: salesforceAuth,
	name: 'get_bulk_ingest_results',
	classification: 'READ',
	displayName: 'Get Bulk Ingest Results',
	description: 'Get the successful, failed or unprocessed rows of a Bulk API 2.0 ingest job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the per-row outcome of a Bulk API 2.0 ingest job as rows: successful rows carry sf__Id and sf__Created, failed rows carry sf__Error. Results only exist once Get Bulk Ingest Job reports JobComplete or Failed; unprocessed rows are those never attempted (e.g. after an abort). Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getBulkIngestResultsOutputSchema,
	props: {
		job_id: Property.ShortText({
			displayName: 'Job ID',
			required: true,
		}),
		result_type: Property.StaticDropdown({
			displayName: 'Result Type',
			required: true,
			defaultValue: 'successfulResults',
			options: {
				options: [
					{ label: 'Successful', value: 'successfulResults' },
					{ label: 'Failed', value: 'failedResults' },
					{ label: 'Unprocessed', value: 'unprocessedrecords' },
				],
			},
		}),
	},
	async run(context) {
		const jobId = salesforceUtils.assertId({ value: context.propsValue.job_id, fieldName: 'Job ID' });
		const response = await callSalesforceApi<string>(
			HttpMethod.GET,
			context.auth,
			`${bulkUtils.BULK_API_PATH}/ingest/${jobId}/${context.propsValue.result_type}`,
			undefined,
			{ responseType: 'text' }
		);
		const rows = bulkUtils.parseCsv(typeof response.body === 'string' ? response.body : '');
		return { rows, count: rows.length };
	},
});
