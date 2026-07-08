import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getJobRuntime = createAction({
  auth: jungleGridAuth,
  name: 'get_job_runtime',
  displayName: 'Get Job Runtime',
  description: 'Get runtime tails, exit code, and runtime availability details for a Jungle Grid job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve runtime execution details for a Jungle Grid job by job ID, including log tails, exit code, and whether runtime data is available. Pick this to diagnose how a job actually ran; use Get Job Status for lifecycle state only, or Get Job Logs for fuller paginated log output. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    job_id: jungleGridCommon.jobId,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobRuntime(context.propsValue.job_id),
    });
  },
});
