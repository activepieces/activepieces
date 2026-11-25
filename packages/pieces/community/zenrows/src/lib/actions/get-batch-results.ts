import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const getBatchResultsAction = createAction({
  auth: zenrowsAuth,
  name: "get_batch_results",
  classification: "READ",
  displayName: "Get Batch Results",
  description: "List the tasks of a batch job's latest run with their status, one page at a time.",
  audience: 'both',
  aiMetadata: {
    description: "Lists the tasks of a batch job's latest run, one page at a time, with each task's URL, status and task_id. Filter by status, and pass next_cursor back as Cursor for the next page. Read a task's page with Get Batch Task Content. Costs no credits; safe to retry.",
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({ displayName: "Status", description: "processing covers both pending and processing task states (anything not yet terminal).", required: false, defaultValue: "all", options: { disabled: false, options: [{ label: "All", value: "all" }, { label: "Successful", value: "successful" }, { label: "Failed", value: "failed" }, { label: "Processing", value: "processing" }] } }),
    cursor: Property.ShortText({ displayName: "Cursor", description: "Opaque pagination token; echo next_cursor.", required: false }),
    job_id: Property.ShortText({ displayName: "Job ID", description: "The batch job's ID, as Create Batch Job returned it (job_id).", required: true }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"GET","server":"https://async.api.zenrows.com/v1","path":"/jobs/{job_id}/results","key":"header","query":["status","cursor"]}, values: propsValue, files });
  },
});
