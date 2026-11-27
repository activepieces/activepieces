import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getBatchJobAction = createAction({
  auth: zenrowsAuth,
  name: "get_batch_job",
  classification: "READ",
  displayName: "Get Batch Job",
  description: "Read a batch job and the progress of its latest run.",
  audience: 'both',
  aiMetadata: {
    description: "Reads a batch job with its latest run: progress in latest_run.stats, spend in latest_run.stats.spend. Poll it after Create Batch Job until latest_run.status is terminal, then read Get Batch Results. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    job_id: Property.ShortText({ displayName: "Job ID", description: "The batch job's ID, as Create Batch Job returned it (job_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://async.api.zenrows.com/v1","path":"/jobs/{job_id}","key":"header"}, values: propsValue, files });
  },
});
