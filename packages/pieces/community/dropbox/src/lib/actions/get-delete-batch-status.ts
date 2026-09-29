import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { deleteBatchStatusOutputSchema } from '../output-schemas';

export const dropboxGetDeleteBatchStatus = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_delete_batch_status',
  classification: 'READ',
  displayName: 'Get Delete Batch Status',
  description: 'Check the status of a delete batch job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a delete batch started by Start Delete Batch, returning in_progress, complete with one result per entry, or failed. Check each entry as well as the overall status, since individual paths can fail inside a complete job. Call once per check rather than looping. Read-only.',
    idempotent: true,
  },
  outputSchema: deleteBatchStatusOutputSchema,
  props: {
    async_job_id: Property.ShortText({
      displayName: 'Async Job ID',
      description: 'The job id returned by Start Delete Batch.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/delete_batch/check',
      body: { async_job_id: context.propsValue.async_job_id },
    });
  },
});
