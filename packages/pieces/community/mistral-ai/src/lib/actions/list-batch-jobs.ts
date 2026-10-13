import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { BATCH_STATUS_OPTIONS, batchUtils, MistralBatchJob } from '../common/batch';
import { listBatchJobsOutputSchema } from '../output-schemas';

export const listBatchJobs = createAction({
	auth: mistralAuth,
	name: 'list_batch_jobs',
	classification: 'SEARCH',
	displayName: 'List Batch Jobs',
	description: 'List batch inference jobs.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists batch inference jobs with their UUIDs, status, endpoint, model and request counts, newest first, optionally filtered by status or model, one page at a time. Use it to find a job id for Get Batch Job or Cancel Batch Job. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listBatchJobsOutputSchema,
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: { options: BATCH_STATUS_OPTIONS },
		}),
		model: Property.ShortText({ displayName: 'Model', required: false }),
		page: Property.Number({ displayName: 'Page', description: 'Zero-based page number.', required: false, defaultValue: 0 }),
		page_size: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 100 }),
	},
	async run(context) {
		const { status, model, page, page_size } = context.propsValue;
		const response = await mistralApi.call<{ data?: MistralBatchJob[]; total: number }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/batch/jobs',
			queryParams: { status, model, page, page_size, order_by: '-created' },
		});
		const jobs = (response.data ?? []).map(batchUtils.formatJob);
		return { jobs, count: jobs.length, total: response.total };
	},
});
