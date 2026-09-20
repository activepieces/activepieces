import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { createFolderBatchStatusOutputSchema } from '../output-schemas';

export const dropboxGetCreateFolderBatchStatus = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_create_folder_batch_status',
  classification: 'READ',
  displayName: 'Get Create Folder Batch Status',
  description: 'Check the status of a create folder batch job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a folder batch started by Start Create Folder Batch, returning in_progress, complete with one result per folder, or failed. Check each entry as well as the overall status, since individual folders can fail inside a complete job. Call once per check rather than looping. Read-only.',
    idempotent: true,
  },
  outputSchema: createFolderBatchStatusOutputSchema,
  props: {
    async_job_id: Property.ShortText({
      displayName: 'Async Job ID',
      description: 'The job id returned by Start Create Folder Batch.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/create_folder_batch/check',
      body: { async_job_id: context.propsValue.async_job_id },
    });
  },
});
