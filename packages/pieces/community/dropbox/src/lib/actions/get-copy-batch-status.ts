import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { relocationStatusOutputSchema } from '../output-schemas';

export const dropboxGetCopyBatchStatus = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_copy_batch_status',
  classification: 'READ',
  displayName: 'Get Copy Batch Status',
  description: 'Check the status of a copy batch job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a copy batch started by Start Copy Batch, returning in_progress or complete with one result per entry. Dropbox reports no overall failure for this job, so check each entry: a batch where every entry failed still reports complete. Call once per check rather than looping. Read-only.',
    idempotent: true,
  },
  outputSchema: relocationStatusOutputSchema,
  props: {
    async_job_id: Property.ShortText({
      displayName: 'Async Job ID',
      description: 'The job id returned by Start Copy Batch.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/copy_batch/check_v2',
      body: { async_job_id: context.propsValue.async_job_id },
    });
  },
});
