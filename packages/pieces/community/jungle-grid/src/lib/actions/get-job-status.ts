import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getJobStatus = createAction({
  auth: jungleGridAuth,
  name: 'get_job_status',
  displayName: 'Get Job Status',
  description: 'Get the current status and metadata for a submitted Jungle Grid job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up the current lifecycle status and metadata of a Jungle Grid job by job ID. Pick this as the standard poll after Submit Job to check whether a job is queued, running, or finished; for exit codes and log tails use Get Job Runtime, and for output files use List Job Artifacts. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    job_id: jungleGridCommon.jobId,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.jobStatus(context.propsValue.job_id),
    });
  },
});
