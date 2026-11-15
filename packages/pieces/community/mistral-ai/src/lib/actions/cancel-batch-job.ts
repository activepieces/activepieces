import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { batchUtils, MistralBatchJob } from '../common/batch';
import { batchJobOutputSchema } from '../output-schemas';

export const cancelBatchJob = createAction({
	auth: mistralAuth,
	name: 'cancel_batch_job',
	classification: 'DESTRUCTIVE',
	displayName: 'Cancel Batch Job',
	description: 'Stop a queued or running batch job.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Requests cancellation of a queued or running batch job and returns its updated status (usually CANCELLATION_REQUESTED, then CANCELLED); requests already completed stay billed and their results are kept. Get the job id from List Batch Jobs. Cancelling an already-cancelled job leaves it cancelled, so a retry is harmless.',
		idempotent: true,
	},
	outputSchema: batchJobOutputSchema,
	props: {
		job_id: batchUtils.jobIdProp(),
	},
	async run(context) {
		const job = await mistralApi.call<MistralBatchJob>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/batch/jobs/${encodeURIComponent(context.propsValue.job_id)}/cancel`,
		});
		return batchUtils.formatJob(job);
	},
});
