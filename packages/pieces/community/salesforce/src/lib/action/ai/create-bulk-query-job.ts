import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { bulkUtils } from '../../common/bulk';
import { bulkJobCreatedOutputSchema } from '../../output-schemas';

export const createBulkQueryJob = createAction({
	auth: salesforceAuth,
	name: 'create_bulk_query_job',
	classification: 'READ',
	displayName: 'Create Bulk Query Job',
	description: 'Start a Bulk API 2.0 query job for large SOQL exports.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts an asynchronous Bulk API 2.0 SOQL query and returns the job id immediately. Poll Get Bulk Query Job until JobComplete, then page through rows with Get Bulk Query Results. Use it for exports of many thousands of rows; for small result sets use the regular SOQL query action. queryAll also returns deleted and archived records. Starts a new job every call.',
		idempotent: false,
	},
	outputSchema: bulkJobCreatedOutputSchema,
	props: {
		query: Property.LongText({
			displayName: 'SOQL Query',
			description: 'e.g. SELECT Id, Name FROM Account. Bulk queries do not support GROUP BY, OFFSET or TYPEOF.',
			required: true,
		}),
		operation: Property.StaticDropdown({
			displayName: 'Operation',
			required: true,
			defaultValue: 'query',
			options: {
				options: [
					{ label: 'Query', value: 'query' },
					{ label: 'Query All (include deleted)', value: 'queryAll' },
				],
			},
		}),
	},
	async run(context) {
		const query = context.propsValue.query.trim();
		if (!query) {
			throw new Error('SOQL Query must not be empty.');
		}
		const response = await callSalesforceApi(HttpMethod.POST, context.auth, `${bulkUtils.BULK_API_PATH}/query`, {
			operation: context.propsValue.operation,
			query,
		});
		const job = bulkUtils.formatJob(response.body);
		return { job_id: job['id'], state: job['state'], operation: job['operation'], object: job['object'] };
	},
});
