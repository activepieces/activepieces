import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { saveUrlStatusOutputSchema } from '../output-schemas';

export const dropboxGetSaveUrlStatus = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_save_url_status',
  classification: 'READ',
  displayName: 'Get Save URL Status',
  description: 'Check the status of a Save URL job',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a Save URL job started by Save URL to Dropbox, returning in_progress, complete with the saved file metadata, or failed. Call it once per check rather than looping; re-run it after a delay while the status is in_progress. Read-only.',
    idempotent: true,
  },
  outputSchema: saveUrlStatusOutputSchema,
  props: {
    async_job_id: Property.ShortText({
      displayName: 'Async Job ID',
      description: 'The job id returned by Save URL to Dropbox.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/save_url/check_job_status',
      body: { async_job_id: context.propsValue.async_job_id },
    });
  },
});
