import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { bulkUtils } from '../../common/bulk';
import { bulkJobOutputSchema } from '../../output-schemas';

export const getBulkIngestJob = createAction({
	auth: salesforceAuth,
	name: 'get_bulk_ingest_job',
	classification: 'READ',
	displayName: 'Get Bulk Ingest Job',
	description: 'Get the status and counters of a Bulk API 2.0 ingest job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the state and processed/failed record counts of a Bulk API 2.0 ingest job started by Run Bulk Ingest Job. Poll it until the state is JobComplete, Failed or Aborted, then call Get Bulk Ingest Results. For query jobs use Get Bulk Query Job. Read-only; safe to retry.',
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
		const response = await callSalesforceApi(HttpMethod.GET, context.auth, `${bulkUtils.BULK_API_PATH}/ingest/${jobId}`, undefined);
		return bulkUtils.formatJob(response.body);
	},
});

