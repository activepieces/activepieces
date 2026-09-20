import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { relocationStatusOutputSchema } from '../output-schemas';

export const dropboxGetMoveBatchStatus = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_move_batch_status',
  classification: 'READ',
  displayName: 'Get Move Batch Status',
  description: 'Check the status of a move batch job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a move batch started by Start Move Batch, returning in_progress or complete with one result per entry. Dropbox reports no overall failure for this job, so check each entry: a batch where every entry failed still reports complete. Call once per check rather than looping. Read-only.',
    idempotent: true,
  },
  outputSchema: relocationStatusOutputSchema,
  props: {
    async_job_id: Property.ShortText({
      displayName: 'Async Job ID',
      description: 'The job id returned by Start Move Batch.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/move_batch/check_v2',
      body: { async_job_id: context.propsValue.async_job_id },
    });
  },
});
