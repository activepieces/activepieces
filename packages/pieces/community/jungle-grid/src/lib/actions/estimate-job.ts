import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const estimateJob = createAction({
  auth: jungleGridAuth,
  name: 'estimate_job',
  displayName: 'Estimate Job',
  description: 'Estimate the cost, duration, and resources for a Jungle Grid job.',
  props: {
    instructions: jungleGridCommon.asyncInstructions,
    ...jungleGridCommon.estimateJobProps,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.estimateJob,
      body: jungleGridCommon.buildEstimateJobPayload(context.propsValue),
    });
  },
});
