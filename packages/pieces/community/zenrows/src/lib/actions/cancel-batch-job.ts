import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const cancelBatchJobAction = createAction({
  auth: zenrowsAuth,
  name: "cancel_batch_job",
  classification: "DESTRUCTIVE",
  displayName: "Cancel Batch Job",
  description: "Stop the batch job's current run. Tasks not yet scraped are not scraped or billed.",
  audience: 'both',
  aiMetadata: {
    description: "Stops a batch job's current run for good; tasks already scraped keep their results. A run that already ended answers 409 run_not_stoppable. It cannot be undone.",
    idempotent: false,
  },
  props: {
    job_id: Property.ShortText({ displayName: "Job ID", description: "The batch job's ID, as Create Batch Job returned it (job_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"POST","server":"https://async.api.zenrows.com/v1","path":"/jobs/{job_id}/cancel","key":"header"}, values: propsValue, files });
  },
});
