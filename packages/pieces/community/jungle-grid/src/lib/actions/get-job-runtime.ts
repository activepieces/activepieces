import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getJobRuntime = createAction({
  auth: jungleGridAuth,
  name: 'get_job_runtime',
  displayName: 'Get Job Runtime',
  description: 'Get runtime tails, exit code, and runtime availability details for a Jungle Grid job.',
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
