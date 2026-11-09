import { Property, createAction } from '@activepieces/pieces-framework';
import { snaprenderAuth } from '../auth';
import { snaprenderBatch } from '../common/batch';
import { snaprenderOutputSchemas } from '../output-schemas';

export const getBatchStatus = createAction({
    auth: snaprenderAuth,
    name: 'get_batch_status',
    classification: 'READ',
    displayName: 'Get Batch Status',
    description: 'Check the progress of a batch and get the download links of finished captures.',
    audience: 'both',
    aiMetadata: {
        description:
            'Returns the status of a batch started with Batch Screenshots: how many captures finished or failed, and a download link for each finished capture. Use it after Batch Screenshots when you did not wait for the results. Jobs and links expire after about a day. Free and safe to repeat.',
        idempotent: true,
    },
    props: {
        jobId: Property.ShortText({
            displayName: 'Job ID',
            description: 'The Job ID from a Batch Screenshots step. Pick it from that step in the data selector.',
            required: true,
            placeholder: '550e8400-e29b-41d4-a716-446655440000',
        }),
    },
    outputSchema: snaprenderOutputSchemas.batch,
    async run(context) {
        const job = await snaprenderBatch.getStatus({ apiKey: context.auth.secret_text, jobId: context.propsValue.jobId });
        return snaprenderBatch.toOutput(job);
    },
});
