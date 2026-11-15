import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { batchUtils, MistralBatchJob } from '../common/batch';
import { batchJobOutputSchema } from '../output-schemas';

export const getBatchJob = createAction({
	auth: mistralAuth,
	name: 'get_batch_job',
	classification: 'READ',
	displayName: 'Get Batch Job',
	description: 'Check the status and results of a batch job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one batch job’s current status and request counts, plus the output and error file ids once it finishes; this is a single check, so call it again until the status is SUCCESS, FAILED, TIMEOUT_EXCEEDED or CANCELLED. Download results with Download File using the output file id, or enable Inline Results for small jobs. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: batchJobOutputSchema,
	props: {
		job_id: batchUtils.jobIdProp(),
		inline: Property.Checkbox({
			displayName: 'Inline Results',
			description: 'Include the results in the response instead of only an output file id. Only for small jobs.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { job_id, inline } = context.propsValue;
		const job = await mistralApi.call<MistralBatchJob>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/batch/jobs/${encodeURIComponent(job_id)}`,
			queryParams: { inline: inline ? true : undefined },
		});
		return batchUtils.formatJob(job);
	},
});
