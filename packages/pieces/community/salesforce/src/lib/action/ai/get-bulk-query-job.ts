import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { bulkUtils } from '../../common/bulk';
import { bulkJobOutputSchema } from '../../output-schemas';

export const getBulkQueryJob = createAction({
	auth: salesforceAuth,
	name: 'get_bulk_query_job',
	classification: 'READ',
	displayName: 'Get Bulk Query Job',
	description: 'Get the status of a Bulk API 2.0 query job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the state and processed record count of a Bulk API 2.0 query job started by Create Bulk Query Job. Poll it until the state is JobComplete (then call Get Bulk Query Results), Failed or Aborted. For ingest jobs use Get Bulk Ingest Job. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: bulkJobOutputSchema,
	props: {
		job_id: Property.ShortText({
			displayName: 'Job ID',
			required: true,
		}),
	},
	async run(context) {
		const jobId = salesforceUtils.assertId({ value: context.propsValue.job_id, fieldName: 'Job ID' });
		const response = await callSalesforceApi(HttpMethod.GET, context.auth, `${bulkUtils.BULK_API_PATH}/query/${jobId}`, undefined);
		return bulkUtils.formatJob(response.body);
	},
});
