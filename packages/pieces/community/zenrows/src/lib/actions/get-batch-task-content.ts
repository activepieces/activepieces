import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getBatchTaskContentAction = createAction({
  auth: zenrowsAuth,
  name: "get_batch_task_content",
  classification: "READ",
  displayName: "Get Batch Task Content",
  description: "Get the scraped page of one task in a batch job's latest run.",
  audience: 'both',
  aiMetadata: {
    description: "Returns what one task of a batch job scraped: HTML, Markdown or JSON, depending on the job's zenrows_params. A task still processing answers 409 task_not_ready. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    job_id: Property.ShortText({ displayName: "Job ID", description: "The batch job's ID, as Create Batch Job returned it (job_id).", required: true }),
    task_id: Property.ShortText({ displayName: "Task ID", description: "The task's ID, from Get Batch Results (task_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://async.api.zenrows.com/v1","path":"/jobs/{job_id}/tasks/{task_id}/content","key":"header","binary":true}, values: propsValue, files });
  },
});
